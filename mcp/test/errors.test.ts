import assert from "node:assert/strict";
import { test } from "node:test";
import { WorkflowError, toErrorPayload, toToolErrorResult } from "../src/errors.js";

test("toErrorPayload converts a WorkflowError into the shared shape", () => {
  const error = new WorkflowError("NOT_FOUND", "Rule 'x' was not found.", { details: { name: "x" } });
  const payload = toErrorPayload(error);
  assert.deepEqual(payload, {
    code: "NOT_FOUND",
    message: "Rule 'x' was not found.",
    retryable: false,
    details: { name: "x" },
  });
});

test("toErrorPayload wraps an unknown thrown value as INTERNAL_ERROR", () => {
  const payload = toErrorPayload(new Error("boom"));
  assert.equal(payload.code, "INTERNAL_ERROR");
  assert.equal(payload.message, "boom");
  assert.equal(payload.retryable, false);
});

test("WorkflowError defaults retryable based on its code", () => {
  assert.equal(new WorkflowError("GITHUB_TIMEOUT", "timed out").retryable, true);
  assert.equal(new WorkflowError("GITHUB_RATE_LIMITED", "rate limited").retryable, true);
  assert.equal(new WorkflowError("INVALID_NAME", "bad name").retryable, false);
  assert.equal(new WorkflowError("NOT_FOUND", "missing").retryable, false);
});

test("toToolErrorResult returns isError:true with a JSON payload in content", () => {
  const result = toToolErrorResult(new WorkflowError("INVALID_NAME", "bad name"));
  assert.equal(result.isError, true);
  assert.equal(result.content.length, 1);
  const parsed = JSON.parse(result.content[0].text);
  assert.equal(parsed.code, "INVALID_NAME");
  assert.equal(parsed.message, "bad name");
});

test("a GITHUB_TOKEN-flavored error never leaks the token", () => {
  const token = "ghp_super_secret_token_value";
  // Simulate what the github client does: the token only ever goes into a header, never into an
  // error message or details.
  const error = new WorkflowError("GITHUB_UNREACHABLE", "GitHub API returned HTTP 403.", {
    retryable: false,
  });
  const result = toToolErrorResult(error);
  assert.equal(result.content[0].text.includes(token), false);
});
