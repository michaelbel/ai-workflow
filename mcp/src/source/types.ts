export type SourceKind = "bundled" | "github";

export interface SourceInfo {
  kind: SourceKind;
  ref: string;
}

export interface SkillSummary {
  name: string;
  description: string;
}

export interface SkillContent {
  description: string;
  content: string;
}

/**
 * Abstraction over where rules/skills content is read from: the npm-packaged bundled
 * snapshot (default, no network) or an optional GitHub-backed remote mode.
 */
export interface WorkflowSource {
  info(): SourceInfo;
  listRules(): Promise<string[]>;
  listSkills(): Promise<SkillSummary[]>;
  getRule(name: string): Promise<string>;
  getSkill(name: string): Promise<SkillContent>;
}
