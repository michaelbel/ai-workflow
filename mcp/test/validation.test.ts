import assert from "node:assert/strict";
import { test } from "node:test";
import { WorkflowError } from "../src/errors.js";
import { validateRuleName, validateSkillName } from "../src/validation.js";

test("validateSkillName accepts plain kebab-case names", () => {
  assert.equal(validateSkillName("new-screen"), "new-screen");
});

test("validateSkillName accepts underscores (e.g. new-alert_dialog)", () => {
  assert.equal(validateSkillName("new-alert_dialog"), "new-alert_dialog");
});

test("validateSkillName strips the deprecated '<name>/SKILL' alias", () => {
  assert.equal(validateSkillName("new-screen/SKILL"), "new-screen");
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

test("validateRuleName accepts '<category>/<RULE_NAME>'", () => {
  assert.equal(validateRuleName("android/MVI_RULES"), "android/MVI_RULES");
  assert.equal(validateRuleName("github/GITHUB_README_RULES"), "github/GITHUB_README_RULES");
});

test("validateRuleName rejects path traversal and malformed names", () => {
  for (const attempt of ["../../etc/passwd", "android/../MVI_RULES", "android/mvi_rules", "MVI_RULES", "android/MVI_RULES/extra"]) {
    assert.throws(() => validateRuleName(attempt), WorkflowError);
  }
});
