export interface ParsedFrontmatter {
  fields: Record<string, string>;
  body: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Minimal YAML-frontmatter parser for our own SKILL.md files.
 *
 * Supports single-line `key: value` fields and a folded block scalar
 * (`key: >-` followed by indented continuation lines, joined with single spaces), which is the
 * only multi-line form used by skills/*\/SKILL.md descriptions. This is intentionally not a
 * general-purpose YAML parser.
 */
export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = markdown.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { fields: {}, body: markdown };
  }

  const rawFrontmatter = match[1];
  const body = match[2] ?? "";
  const lines = rawFrontmatter.split(/\r?\n/);
  const fields: Record<string, string> = {};

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const fieldMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!fieldMatch) {
      index += 1;
      continue;
    }

    const key = fieldMatch[1];
    const rest = fieldMatch[2];

    if (rest === ">-" || rest === "|-" || rest === ">" || rest === "|") {
      const foldedLines: string[] = [];
      index += 1;
      while (index < lines.length && (lines[index].startsWith("  ") || lines[index].trim() === "")) {
        foldedLines.push(lines[index].replace(/^ {2}/, ""));
        index += 1;
      }
      const joiner = rest === "|-" || rest === "|" ? "\n" : " ";
      fields[key] = foldedLines.join(joiner).trim();
      continue;
    }

    fields[key] = rest.trim();
    index += 1;
  }

  return { fields, body };
}
