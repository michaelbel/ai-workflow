import { WorkflowError } from "../errors.js";
import { getServerVersion } from "../version.js";
import { BundledSource } from "./bundled.js";
import { GithubSource } from "./github-source.js";
import type { WorkflowSource } from "./types.js";

export type { WorkflowSource, SourceInfo, SkillSummary, SkillContent } from "./types.js";
export { BundledSource } from "./bundled.js";
export { GithubSource } from "./github-source.js";

/** `mcp-v1.2.3` — an immutable release tag, never `main`/`master`. */
const TAG_REF_PATTERN = /^mcp-v\d+\.\d+\.\d+$/;
/** A full 40-hex-character commit SHA. */
const SHA_REF_PATTERN = /^[0-9a-f]{40}$/;

export function defaultGithubRef(): string {
  return `mcp-v${getServerVersion()}`;
}

/**
 * Validates a ref intended for the optional GitHub source mode. Only an immutable release tag
 * (`mcp-v<semver>`) or a full commit SHA is accepted — `main`, `master`, short SHAs, branch
 * names, and anything else are rejected so the server can never be pointed at a moving target.
 */
export function validateGithubRef(ref: string): string {
  if (TAG_REF_PATTERN.test(ref) || SHA_REF_PATTERN.test(ref)) {
    return ref;
  }
  throw new WorkflowError(
    "INVALID_SOURCE_REF",
    `Invalid AI_WORKFLOW_GITHUB_REF '${ref}'. Expected an immutable tag like 'mcp-v1.2.3' or a full 40-character commit SHA.`
  );
}

export interface CreateSourceEnv {
  AI_WORKFLOW_SOURCE?: string;
  AI_WORKFLOW_GITHUB_REF?: string;
  GITHUB_TOKEN?: string;
}

/**
 * Picks the WorkflowSource implementation from environment variables. Bundled (no network) is
 * the default; GitHub mode is opt-in via `AI_WORKFLOW_SOURCE=github` and always resolves to a
 * validated immutable ref, never the mutable `main` branch.
 */
export function createSource(env: CreateSourceEnv, fetchImpl?: typeof fetch): WorkflowSource {
  if (env.AI_WORKFLOW_SOURCE === "github") {
    const ref = validateGithubRef(env.AI_WORKFLOW_GITHUB_REF ?? defaultGithubRef());
    return new GithubSource(ref, env.GITHUB_TOKEN, fetchImpl);
  }

  return new BundledSource(defaultGithubRef());
}
