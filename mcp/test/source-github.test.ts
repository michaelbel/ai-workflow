import assert from "node:assert/strict";
import { test } from "node:test";
import { WorkflowError } from "../src/errors.js";
import { GithubClient } from "../src/source/github.js";

type FetchStub = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function textResponse(status: number, body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

function queueFetch(responses: Array<() => Response>): { fetchImpl: FetchStub; calls: RequestInit[] } {
  const calls: RequestInit[] = [];
  let index = 0;
  const fetchImpl: FetchStub = async (_input, init) => {
    calls.push(init ?? {});
    const factory = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return factory();
  };
  return { fetchImpl, calls };
}

function abortingFetch(): FetchStub {
  return (_input, init) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener("abort", () => {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        reject(error);
      });
    });
}

test("GithubClient.fetchFile times out via AbortController", async () => {
  const client = new GithubClient({
    owner: "o",
    repo: "r",
    fetchImpl: abortingFetch(),
    timeoutMs: 20,
    maxAttempts: 1,
  });
  await assert.rejects(
    () => client.fetchFile("mcp-v1.0.0", "rules/x.md"),
    (error: unknown) => error instanceof WorkflowError && error.code === "GITHUB_TIMEOUT"
  );
});

test("GithubClient retries after 429 honoring Retry-After, then succeeds", async () => {
  const { fetchImpl, calls } = queueFetch([
    () => textResponse(429, "", { "retry-after": "0" }),
    () => textResponse(200, "rule content"),
  ]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 3, timeoutMs: 1000 });
  const content = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(content, "rule content");
  assert.equal(calls.length, 2);
});

test("GithubClient retries after a 5xx, then succeeds", async () => {
  const { fetchImpl, calls } = queueFetch([
    () => textResponse(503, "service unavailable"),
    () => textResponse(200, "rule content"),
  ]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 3, timeoutMs: 1000 });
  const content = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(content, "rule content");
  assert.equal(calls.length, 2);
});

test("GithubClient does not retry on a plain 404", async () => {
  const { fetchImpl, calls } = queueFetch([() => textResponse(404, "not found")]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 3, timeoutMs: 1000 });
  await assert.rejects(
    () => client.fetchFile("mcp-v1.0.0", "rules/missing.md"),
    (error: unknown) => error instanceof WorkflowError && error.code === "NOT_FOUND"
  );
  assert.equal(calls.length, 1);
});

test("GithubClient does not retry on a plain 403", async () => {
  const { fetchImpl, calls } = queueFetch([() => textResponse(403, "forbidden")]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 3, timeoutMs: 1000 });
  await assert.rejects(() => client.fetchFile("mcp-v1.0.0", "rules/x.md"), WorkflowError);
  assert.equal(calls.length, 1);
});

test("GithubClient enforces the file size cap", async () => {
  const bigBody = "x".repeat(200);
  const { fetchImpl } = queueFetch([() => textResponse(200, bigBody)]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, fileMaxBytes: 100, maxAttempts: 1 });
  await assert.rejects(
    () => client.fetchFile("mcp-v1.0.0", "rules/x.md"),
    (error: unknown) => error instanceof WorkflowError && error.code === "RESPONSE_TOO_LARGE"
  );
});

test("GithubClient enforces the tree size cap", async () => {
  const bigTree = JSON.stringify({ tree: Array.from({ length: 5000 }, (_, i) => ({ path: `f${i}`, type: "blob" })) });
  const { fetchImpl } = queueFetch([() => textResponse(200, bigTree)]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, treeMaxBytes: 100, maxAttempts: 1 });
  await assert.rejects(
    () => client.listTree("mcp-v1.0.0"),
    (error: unknown) => error instanceof WorkflowError && error.code === "RESPONSE_TOO_LARGE"
  );
});

test("GithubClient caches a successful file fetch", async () => {
  const { fetchImpl, calls } = queueFetch([() => textResponse(200, "content")]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, cacheTtlMs: 10_000, maxAttempts: 1 });
  const first = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  const second = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(first, "content");
  assert.equal(second, "content");
  assert.equal(calls.length, 1);
});

test("GithubClient re-fetches after the cache TTL expires", async () => {
  const { fetchImpl, calls } = queueFetch([
    () => textResponse(200, "v1"),
    () => textResponse(200, "v2"),
  ]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, cacheTtlMs: 10, maxAttempts: 1 });
  const first = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  await new Promise((resolve) => setTimeout(resolve, 30));
  const second = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(first, "v1");
  assert.equal(second, "v2");
  assert.equal(calls.length, 2);
});

test("GithubClient de-duplicates concurrent requests for the same file", async () => {
  let callCount = 0;
  const fetchImpl: FetchStub = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return textResponse(200, "content");
  };
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 1 });
  const [a, b] = await Promise.all([
    client.fetchFile("mcp-v1.0.0", "rules/x.md"),
    client.fetchFile("mcp-v1.0.0", "rules/x.md"),
  ]);
  assert.equal(a, "content");
  assert.equal(b, "content");
  assert.equal(callCount, 1);
});

test("GithubClient falls back to a stale cached value when a later fetch fails", async () => {
  const { fetchImpl } = queueFetch([
    () => textResponse(200, "fresh"),
    () => textResponse(503, "down"),
    () => textResponse(503, "down"),
    () => textResponse(503, "down"),
  ]);
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, cacheTtlMs: 1, maxAttempts: 3, timeoutMs: 1000 });
  const first = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(first, "fresh");
  await new Promise((resolve) => setTimeout(resolve, 10));
  const second = await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.equal(second, "fresh");
});

test("GithubClient sends GITHUB_TOKEN as an Authorization header and never leaks it in an error", async () => {
  const token = "ghp_secret_token_value";
  let sawAuthHeader = "";
  const fetchImpl: FetchStub = async (_input, init) => {
    const headers = init?.headers as Record<string, string> | undefined;
    sawAuthHeader = headers?.Authorization ?? "";
    return textResponse(403, "forbidden");
  };
  const client = new GithubClient({ owner: "o", repo: "r", token, fetchImpl, maxAttempts: 1 });

  assert.equal(sawAuthHeader, "");
  try {
    await client.fetchFile("mcp-v1.0.0", "rules/x.md");
    assert.fail("expected fetchFile to throw");
  } catch (error) {
    assert.ok(error instanceof WorkflowError);
    assert.equal(error.message.includes(token), false);
    assert.equal(JSON.stringify(error).includes(token), false);
  }
  assert.equal(sawAuthHeader, `Bearer ${token}`);
});

test("GithubClient sends a User-Agent and Accept header", async () => {
  let seenHeaders: Record<string, string> = {};
  const fetchImpl: FetchStub = async (_input, init) => {
    seenHeaders = (init?.headers as Record<string, string>) ?? {};
    return textResponse(200, "content");
  };
  const client = new GithubClient({ owner: "o", repo: "r", fetchImpl, maxAttempts: 1 });
  await client.fetchFile("mcp-v1.0.0", "rules/x.md");
  assert.ok(seenHeaders["User-Agent"]);
  assert.equal(seenHeaders.Accept, "application/vnd.github+json");
});
