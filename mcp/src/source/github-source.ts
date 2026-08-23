import { WorkflowError } from "../errors.js";
import { parseFrontmatter } from "../frontmatter.js";
import { GithubClient } from "./github.js";
import type { SkillContent, SkillSummary, SourceInfo, WorkflowSource } from "./types.js";

const OWNER = "michaelbel";
const REPO = "ai-workflow";

/**
 * Optional remote WorkflowSource: reads rules/skills straight from GitHub at a pinned,
 * validated ref (never `main`/`master`). Read-only, but network-dependent (`openWorldHint: true`
 * on the tools that use it).
 */
export class GithubSource implements WorkflowSource {
  private readonly client: GithubClient;

  constructor(private readonly ref: string, token: string | undefined, fetchImpl?: typeof fetch) {
    this.client = new GithubClient({ owner: OWNER, repo: REPO, token, fetchImpl });
  }

  info(): SourceInfo {
    return { kind: "github", ref: this.ref };
  }

  async listRules(): Promise<string[]> {
    const tree = await this.client.listTree(this.ref);
    return tree
      .filter((item) => item.type === "blob" && /^rules\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(item.path))
      .map((item) => item.path.replace(/^rules\//, "").replace(/\.md$/, ""))
      .sort();
  }

  async listSkills(): Promise<SkillSummary[]> {
    const tree = await this.client.listTree(this.ref);
    const skillPaths = tree
      .filter((item) => item.type === "blob" && /^skills\/[^/]+\/SKILL\.md$/.test(item.path))
      .map((item) => item.path)
      .sort();

    const summaries: SkillSummary[] = [];
    for (const path of skillPaths) {
      const name = path.replace(/^skills\//, "").replace(/\/SKILL\.md$/, "");
      const raw = await this.client.fetchFile(this.ref, path);
      const { fields } = parseFrontmatter(raw);
      summaries.push({ name, description: fields.description ?? "" });
    }
    return summaries;
  }

  async getRule(name: string): Promise<string> {
    try {
      return await this.client.fetchFile(this.ref, `rules/${name}.md`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Rule '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }
  }

  async getSkill(name: string): Promise<SkillContent> {
    let raw: string;
    try {
      raw = await this.client.fetchFile(this.ref, `skills/${name}/SKILL.md`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Skill '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }

    const { fields, body } = parseFrontmatter(raw);
    return { description: fields.description ?? "", content: body.trim() };
  }
}
