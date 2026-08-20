import { WorkflowError } from "./errors.js";

const DEPRECATED_SKILL_SUFFIX = "/SKILL";

/**
 * Pure kebab-case skill directory name: lowercase alphanumeric segments separated by `-`.
 * No slash, dot, backslash, underscore, uppercase letter, or whitespace can appear, which is
 * sufficient to make path traversal (`..`, `/`, absolute paths) impossible.
 */
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Rule name: `<category>/<RULE_NAME>`, e.g. `android/MVI_RULES`. Exactly one `/` is allowed by
 * construction (neither side of the pattern can contain `/`), so traversal sequences like
 * `../../etc/passwd` cannot match.
 */
const RULE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[A-Z0-9]+(?:_[A-Z0-9]+)*$/;

/**
 * Validates a skill name from an MCP caller. Accepts the deprecated `<name>/SKILL` alias (stripped
 * before validation) for backward compatibility, but the returned value is always the bare name.
 */
export function validateSkillName(rawName: string): string {
  const name = rawName.endsWith(DEPRECATED_SKILL_SUFFIX)
    ? rawName.slice(0, -DEPRECATED_SKILL_SUFFIX.length)
    : rawName;

  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid skill name '${rawName}'. Expected a kebab-case skill directory name, e.g. 'create-feature-scaffold-screen'.`
    );
  }

  return name;
}

export function validateRuleName(rawName: string): string {
  if (!RULE_NAME_PATTERN.test(rawName)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid rule name '${rawName}'. Expected '<category>/<RULE_NAME>', e.g. 'android/MVI_RULES'.`
    );
  }

  return rawName;
}
