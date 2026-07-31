import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFrontmatter } from "../src/frontmatter.js";

test("parseFrontmatter reads simple single-line fields", () => {
  const markdown = ["---", "name: new-screen", "---", "", "# Body"].join("\n");
  const { fields, body } = parseFrontmatter(markdown);
  assert.equal(fields.name, "new-screen");
  assert.equal(body.trim(), "# Body");
});

test("parseFrontmatter folds a '>-' block scalar into a single line", () => {
  const markdown = [
    "---",
    "name: new-screen",
    "description: >-",
    "  Use when the user asks to create a screen.",
    "  Do not use for a dialog; use new-alert_dialog instead.",
    "---",
    "",
    "# Body",
  ].join("\n");

  const { fields } = parseFrontmatter(markdown);
  assert.equal(
    fields.description,
    "Use when the user asks to create a screen. Do not use for a dialog; use new-alert_dialog instead."
  );
});

test("parseFrontmatter returns empty fields when there is no frontmatter block", () => {
  const { fields, body } = parseFrontmatter("# Just a heading\n");
  assert.deepEqual(fields, {});
  assert.equal(body, "# Just a heading\n");
});
