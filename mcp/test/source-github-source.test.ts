import assert from "node:assert/strict";
import { test } from "node:test";
import { GithubSource } from "../src/source/github-source.js";

test("GithubSource.listRules() exposes only flat rule basenames", async () => {
  const tree = {
    tree: [
      { path: "rules/mvi.md", type: "blob" },
      { path: "rules/git.md", type: "blob" },
      { path: "rules/android/LEGACY_RULES.md", type: "blob" },
      { path: "rules/MVI_RULES.md", type: "blob" },
      { path: "rules/lowercase_rule.md", type: "blob" },
      { path: "rules/README.txt", type: "blob" },
      { path: "skills/example/SKILL.md", type: "blob" },
    ],
  };
  const fetchImpl: typeof fetch = async () => new Response(JSON.stringify(tree), { status: 200 });
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  assert.deepEqual(await source.listRules(), ["git", "mvi"]);
});

test("GithubSource.getRule() reads a flat rules/<name>.md path", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return new Response("# MVI", { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  assert.equal(await source.getRule("mvi"), "# MVI");
  assert.ok(requestedUrl.endsWith("/mcp-vtest/rules/mvi.md"));
});
