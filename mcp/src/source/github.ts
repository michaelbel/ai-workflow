import { getServerName, getServerVersion } from "../version.js";
import { WorkflowError } from "../errors.js";
import { BoundedTtlCache, RequestDeduplicator } from "./cache.js";

const BASE_RAW = "https://raw.githubusercontent.com";
const BASE_API = "https://api.github.com";

/** Per-request timeout. */
export const GITHUB_TIMEOUT_MS = 10_000;
/** Total attempts (1 initial + up to 2 retries). */
export const GITHUB_MAX_ATTEMPTS = 3;
/** Base delay for exponential backoff between retries, when the server gives no Retry-After. */
export const GITHUB_RETRY_BASE_DELAY_MS = 300;
/** Cap on a `git/trees` API response body. */
export const GITHUB_TREE_MAX_BYTES = 5 * 1024 * 1024;
/** Cap on a single raw markdown file body. */
export const GITHUB_FILE_MAX_BYTES = 1 * 1024 * 1024;
/** How long a successful response is considered fresh. */
export const GITHUB_CACHE_TTL_MS = 10 * 60 * 1000;
/** Bounded cache size (per cache instance), oldest entry evicted once exceeded. */
export const GITHUB_CACHE_MAX_ENTRIES = 200;

export interface GithubTreeItem {
  path: string;
  type: string;
}

export interface GithubClientOptions {
  owner: string;
  repo: string;
  token?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxAttempts?: number;
  treeMaxBytes?: number;
  fileMaxBytes?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(res: Response): number | undefined {
  const header = res.headers.get("retry-after");
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
}

/**
 * Hardened GitHub HTTP client for the optional remote source mode: bounded timeout, bounded
 * retry (only for transport errors, 429, and 5xx — never for a plain 4xx like 404/403), honors
 * `Retry-After`, caps response size, and never logs the token (it only ever goes into the
 * `Authorization` header of the outgoing request).
 */
export class GithubClient {
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly treeMaxBytes: number;
  private readonly fileMaxBytes: number;

  private readonly fileCache: BoundedTtlCache<string>;
  private readonly treeCache: BoundedTtlCache<GithubTreeItem[]>;
  private readonly fileDedup = new RequestDeduplicator<string>();
  private readonly treeDedup = new RequestDeduplicator<GithubTreeItem[]>();

  constructor(private readonly options: GithubClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? GITHUB_TIMEOUT_MS;
    this.maxAttempts = options.maxAttempts ?? GITHUB_MAX_ATTEMPTS;
    this.treeMaxBytes = options.treeMaxBytes ?? GITHUB_TREE_MAX_BYTES;
    this.fileMaxBytes = options.fileMaxBytes ?? GITHUB_FILE_MAX_BYTES;
    const ttlMs = options.cacheTtlMs ?? GITHUB_CACHE_TTL_MS;
    const maxEntries = options.cacheMaxEntries ?? GITHUB_CACHE_MAX_ENTRIES;
    this.fileCache = new BoundedTtlCache<string>({ ttlMs, maxEntries });
    this.treeCache = new BoundedTtlCache<GithubTreeItem[]>({ ttlMs, maxEntries });
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": `${getServerName()}/${getServerVersion()}`,
      Accept: "application/vnd.github+json",
    };
    if (this.options.token) {
      headers.Authorization = `Bearer ${this.options.token}`;
    }
    return headers;
  }

  private async requestText(url: string, headers: Record<string, string>, maxBytes: number): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await this.fetchImpl(url, { headers, signal: controller.signal });
        clearTimeout(timeoutHandle);

        if (res.status === 404) {
          throw new WorkflowError("NOT_FOUND", `GitHub resource not found (HTTP 404).`, { retryable: false });
        }

        if (res.status === 429) {
          if (attempt < this.maxAttempts) {
            await delay(parseRetryAfterMs(res) ?? GITHUB_RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          throw new WorkflowError("GITHUB_RATE_LIMITED", "GitHub API rate limit exceeded.", { retryable: true });
        }

        if (res.status >= 500 && res.status < 600) {
          if (attempt < this.maxAttempts) {
            await delay(parseRetryAfterMs(res) ?? GITHUB_RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          throw new WorkflowError("GITHUB_UNREACHABLE", `GitHub API returned HTTP ${res.status}.`, {
            retryable: true,
          });
        }

        if (!res.ok) {
          // A definitive, non-retryable 4xx (401/403/etc). Retrying with the same request will
          // not succeed, so this is not retryable even though the code is GITHUB_UNREACHABLE.
          throw new WorkflowError("GITHUB_UNREACHABLE", `GitHub API returned HTTP ${res.status}.`, {
            retryable: false,
          });
        }

        const text = await res.text();
        if (Buffer.byteLength(text, "utf8") > maxBytes) {
          throw new WorkflowError("RESPONSE_TOO_LARGE", `GitHub response exceeded the ${maxBytes}-byte limit.`, {
            retryable: false,
          });
        }
        return text;
      } catch (error) {
        clearTimeout(timeoutHandle);

        if (error instanceof WorkflowError) {
          if (!error.retryable || attempt >= this.maxAttempts) {
            throw error;
          }
          lastError = error;
          await delay(GITHUB_RETRY_BASE_DELAY_MS * attempt);
          continue;
        }

        const isAbort = error instanceof Error && error.name === "AbortError";
        lastError = new WorkflowError(
          isAbort ? "GITHUB_TIMEOUT" : "GITHUB_UNREACHABLE",
          isAbort ? "GitHub request timed out." : `GitHub request failed: ${error instanceof Error ? error.message : String(error)}`,
          { retryable: true }
        );

        if (attempt >= this.maxAttempts) {
          throw lastError;
        }
        await delay(GITHUB_RETRY_BASE_DELAY_MS * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new WorkflowError("GITHUB_UNREACHABLE", "GitHub request failed.");
  }

  async fetchFile(ref: string, path: string): Promise<string> {
    const cacheKey = `${ref}:${path}`;
    const cached = this.fileCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    return this.fileDedup.run(cacheKey, async () => {
      const url = `${BASE_RAW}/${this.options.owner}/${this.options.repo}/${ref}/${path}`;
      try {
        const text = await this.requestText(url, this.authHeaders(), this.fileMaxBytes);
        this.fileCache.set(cacheKey, text);
        return text;
      } catch (error) {
        const stale = this.fileCache.getStale(cacheKey);
        if (stale !== undefined && error instanceof WorkflowError && error.code !== "NOT_FOUND") {
          return stale;
        }
        throw error;
      }
    });
  }

  async listTree(ref: string): Promise<GithubTreeItem[]> {
    const cacheKey = ref;
    const cached = this.treeCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    return this.treeDedup.run(cacheKey, async () => {
      const url = `${BASE_API}/repos/${this.options.owner}/${this.options.repo}/git/trees/${ref}?recursive=1`;
      try {
        const text = await this.requestText(url, this.authHeaders(), this.treeMaxBytes);
        const data = JSON.parse(text) as { tree: GithubTreeItem[] };
        const tree = data.tree ?? [];
        this.treeCache.set(cacheKey, tree);
        return tree;
      } catch (error) {
        const stale = this.treeCache.getStale(cacheKey);
        if (stale !== undefined && error instanceof WorkflowError && error.code !== "NOT_FOUND") {
          return stale;
        }
        throw error;
      }
    });
  }
}
