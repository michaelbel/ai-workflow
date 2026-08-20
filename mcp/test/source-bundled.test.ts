import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { BundledSource } from "../src/source/bundled.js";

const mcpDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(mcpDir, "assets");

function countMarkdownFilesRecursive(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      count += countMarkdownFilesRecursive(fullPath);
    } else if (entry.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}

test("BundledSource.listRules() matches the number of .md files under assets/rules (no hardcoded count)", async () => {
  const source = new BundledSource("mcp-vtest");
  const rules = await source.listRules();
  const expected = countMarkdownFilesRecursive(join(assetsDir, "rules"));
  assert.equal(rules.length, expected);
  assert.ok(rules.includes("android/MVI_RULES"));
});

test("BundledSource.listSkills() matches the number of skill directories under assets/skills", async () => {
  const source = new BundledSource("mcp-vtest");
  const skills = await source.listSkills();
  const expectedDirs = readdirSync(join(assetsDir, "skills")).filter((entry) =>
    statSync(join(assetsDir, "skills", entry)).isDirectory()
  );
  assert.equal(skills.length, expectedDirs.length);
  assert.ok(skills.every((skill) => skill.name.length > 0));
  assert.ok(skills.every((skill) => skill.description.length > 0));
});

test("BundledSource.listSkills() returns bare directory names, never '<name>/SKILL'", async () => {
  const source = new BundledSource("mcp-vtest");
  const skills = await source.listSkills();
  const names = skills.map((skill) => skill.name);
  assert.ok(names.includes("create-mvi-feature"));
  assert.ok(!names.some((name) => name.includes("/SKILL")));
});

test("BundledSource.getSkill('create-mvi-feature') reads assets/skills/create-mvi-feature/SKILL.md", async () => {
  const source = new BundledSource("mcp-vtest");
  const skill = await source.getSkill("create-mvi-feature");
  assert.ok(skill.content.includes("{Feature}ViewModel"));
  assert.ok(skill.description.toLowerCase().includes("use when"));
});

test("BundledSource.getRule('android/MVI_RULES') reads assets/rules/android/MVI_RULES.md", async () => {
  const source = new BundledSource("mcp-vtest");
  const content = await source.getRule("android/MVI_RULES");
  assert.ok(content.includes("dispatch"));
});

test("BundledSource.getRule() throws NOT_FOUND for an unknown rule", async () => {
  const source = new BundledSource("mcp-vtest");
  await assert.rejects(() => source.getRule("android/DOES_NOT_EXIST"), (error: unknown) => {
    return error instanceof Error && (error as { code?: string }).code === "NOT_FOUND";
  });
});

test("BundledSource.getSkill() throws NOT_FOUND for an unknown skill", async () => {
  const source = new BundledSource("mcp-vtest");
  await assert.rejects(() => source.getSkill("does-not-exist"), (error: unknown) => {
    return error instanceof Error && (error as { code?: string }).code === "NOT_FOUND";
  });
});

test("BundledSource performs no network access", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    fetchCalled = true;
    return originalFetch(...args);
  }) as typeof fetch;
  try {
    const source = new BundledSource("mcp-vtest");
    await source.listRules();
    await source.listSkills();
    await source.getRule("android/MVI_RULES");
    await source.getSkill("create-mvi-feature");
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("BundledSource.info() reports kind 'bundled'", () => {
  const source = new BundledSource("mcp-vtest");
  assert.deepEqual(source.info(), { kind: "bundled", ref: "mcp-vtest" });
});
