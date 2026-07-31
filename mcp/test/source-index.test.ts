import assert from "node:assert/strict";
import { test } from "node:test";
import { WorkflowError } from "../src/errors.js";
import { BundledSource } from "../src/source/bundled.js";
import { GithubSource } from "../src/source/github-source.js";
import { createSource, defaultGithubRef, validateGithubRef } from "../src/source/index.js";
import { getServerVersion } from "../src/version.js";

test("defaultGithubRef is 'mcp-v<packageVersion>', never main/master", () => {
  const ref = defaultGithubRef();
  assert.equal(ref, `mcp-v${getServerVersion()}`);
  assert.notEqual(ref, "main");
  assert.notEqual(ref, "master");
});

test("validateGithubRef accepts an 'mcp-v<semver>' tag", () => {
  assert.equal(validateGithubRef("mcp-v1.6.4"), "mcp-v1.6.4");
});

test("validateGithubRef accepts a full 40-hex-char commit SHA", () => {
  const sha = "a".repeat(40);
  assert.equal(validateGithubRef(sha), sha);
});

test("validateGithubRef rejects 'main', 'master', short SHAs, and arbitrary branch names", () => {
  for (const ref of ["main", "master", "a1b2c3", "release", "mcp-v1.6", "HEAD"]) {
    assert.throws(
      () => validateGithubRef(ref),
      (error: unknown) => error instanceof WorkflowError && error.code === "INVALID_SOURCE_REF"
    );
  }
});

test("createSource defaults to BundledSource with no network mode requested", () => {
  const source = createSource({});
  assert.ok(source instanceof BundledSource);
  assert.equal(source.info().kind, "bundled");
});

test("createSource returns GithubSource only when AI_WORKFLOW_SOURCE=github is set explicitly", () => {
  const source = createSource({ AI_WORKFLOW_SOURCE: "github" });
  assert.ok(source instanceof GithubSource);
  assert.equal(source.info().kind, "github");
  assert.equal(source.info().ref, defaultGithubRef());
});

test("createSource rejects an invalid AI_WORKFLOW_GITHUB_REF before making any request", () => {
  assert.throws(
    () => createSource({ AI_WORKFLOW_SOURCE: "github", AI_WORKFLOW_GITHUB_REF: "main" }),
    (error: unknown) => error instanceof WorkflowError && error.code === "INVALID_SOURCE_REF"
  );
});
