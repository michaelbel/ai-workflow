import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WorkflowError } from "../errors.js";
import { parseFrontmatter } from "../frontmatter.js";
import type { SkillContent, SkillSummary, SourceInfo, WorkflowSource } from "./types.js";

/**
 * Directory the npm package ships rules/skills in. `scripts/copy-assets.ts` populates this
 * directory (from the repository's `rules/`/`skills/`) before every build/dev/test/pack, and
 * `package.json#files` includes it, so this is what `npm pack`/`npm publish` embeds.
 */
function assetsDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return join(moduleDir, "..", "..", "assets");
}

/**
 * Default WorkflowSource: reads the bundled npm-packaged snapshot from `mcp/assets`. Performs no
 * network access whatsoever.
 */
export class BundledSource implements WorkflowSource {
  private readonly rulesDir: string;
  private readonly skillsDir: string;

  constructor(private readonly ref: string) {
    const base = assetsDir();
    this.rulesDir = join(base, "rules");
    this.skillsDir = join(base, "skills");
  }

  info(): SourceInfo {
    return { kind: "bundled", ref: this.ref };
  }

  async listRules(): Promise<string[]> {
    return readdirSync(this.rulesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(entry.name))
      .map((entry) => entry.name.replace(/\.md$/, ""))
      .sort();
  }

  async listSkills(): Promise<SkillSummary[]> {
    const skillNames = readdirSync(this.skillsDir)
      .filter((entry) => statSync(join(this.skillsDir, entry)).isDirectory())
      .sort();

    const summaries: SkillSummary[] = [];
    for (const name of skillNames) {
      const skillMdPath = join(this.skillsDir, name, "SKILL.md");
      try {
        const raw = readFileSync(skillMdPath, "utf8");
        const { fields } = parseFrontmatter(raw);
        summaries.push({ name, description: fields.description ?? "" });
      } catch {
        // A skill directory without a readable SKILL.md is not listed; get_skill will still
        // surface NOT_FOUND if it's requested directly.
      }
    }
    return summaries;
  }

  async getRule(name: string): Promise<string> {
    const path = join(this.rulesDir, `${name}.md`);
    try {
      return readFileSync(path, "utf8");
    } catch {
      throw new WorkflowError("NOT_FOUND", `Rule '${name}' was not found in the bundled snapshot.`);
    }
  }

  async getSkill(name: string): Promise<SkillContent> {
    const path = join(this.skillsDir, name, "SKILL.md");
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      throw new WorkflowError("NOT_FOUND", `Skill '${name}' was not found in the bundled snapshot.`);
    }

    const { fields, body } = parseFrontmatter(raw);
    return { description: fields.description ?? "", content: body.trim() };
  }
}
