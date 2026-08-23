import assert from "node:assert/strict";
import { test } from "node:test";
import { WorkflowError } from "../src/errors.js";
import { validateRuleName, validateSkillName } from "../src/validation.js";

test("validateSkillName accepts plain kebab-case names", () => {
  assert.equal(validateSkillName("create-feature-scaffold-screen"), "create-feature-scaffold-screen");
});

test("validateSkillName rejects underscores", () => {
  assert.throws(() => validateSkillName("new-alert_dialog"), WorkflowError);
});

test("validateSkillName strips the deprecated '<name>/SKILL' alias", () => {
  assert.equal(validateSkillName("create-feature-scaffold-screen/SKILL"), "create-feature-scaffold-screen");
});

test("validateSkillName rejects path traversal", () => {
  for (const attempt of ["../../etc/passwd", "..%2f..", "/etc/passwd", "a/b", "a\\b", ".."]) {
    assert.throws(() => validateSkillName(attempt), WorkflowError);
  }
});

test("validateSkillName rejects uppercase and whitespace", () => {
  assert.throws(() => validateSkillName("New-Screen"), WorkflowError);
  assert.throws(() => validateSkillName("new screen"), WorkflowError);
});

test("validateRuleName accepts lowercase kebab-case rule basenames", () => {
  assert.equal(validateRuleName("mvi"), "mvi");
  assert.equal(validateRuleName("github-readme"), "github-readme");
});

test("validateRuleName rejects path traversal and malformed names", () => {
  for (const attempt of [
    "../../etc/passwd",
    "android/../mvi",
    "mvi_rules",
    "android/mvi",
    "mvi.md",
    "MVI_RULES",
    "MVI-RULES",
  ]) {
    assert.throws(() => validateRuleName(attempt), WorkflowError);
  }
});
