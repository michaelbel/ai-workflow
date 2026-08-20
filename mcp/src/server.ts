import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolErrorResult } from "./errors.js";
import { createSource, type CreateSourceEnv, type WorkflowSource } from "./source/index.js";
import { validateRuleName, validateSkillName } from "./validation.js";
import { getServerName, getServerVersion } from "./version.js";

const SERVER_INSTRUCTIONS = [
  "Use this server as the source of truth for ai-workflow rules and skills.",
  "Before any git commit, call get_rule with name 'git/GIT_RULES' and apply the returned rules.",
  "Before deleting files, call get_rule with name 'project/FILESYSTEM_RULES' and apply the returned rules.",
].join("\n");

const sourceOutputShape = {
  kind: z.enum(["bundled", "github"]),
  ref: z.string(),
};

export interface CreateServerOptions {
  /** Environment used to pick/configure the source when `source` isn't supplied directly. Defaults to `process.env`. */
  env?: CreateSourceEnv;
  /** Inject a WorkflowSource directly (used by tests). Takes precedence over `env`. */
  source?: WorkflowSource;
  /** Inject a fetch implementation for the GitHub source (used by tests). Ignored if `source` is supplied. */
  fetchImpl?: typeof fetch;
}

/**
 * Builds the MCP server and registers its tools. Contains no transport/connect logic, so it can
 * be constructed and exercised directly in tests without spawning a process or opening stdio.
 */
export function createServer(options: CreateServerOptions = {}): McpServer {
  const env = options.env ?? (process.env as CreateSourceEnv);
  const source = options.source ?? createSource(env, options.fetchImpl);
  const sourceInfo = source.info();
  const readOnlyHint = true;
  const openWorldHint = sourceInfo.kind === "github";

  const server = new McpServer(
    { name: getServerName(), version: getServerVersion() },
    { instructions: SERVER_INSTRUCTIONS }
  );

  // ─── list ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "list",
    {
      title: "List rules and skills",
      description: "List all available rule names and skill names/descriptions in the ai-workflow repository.",
      inputSchema: {},
      outputSchema: {
        rules: z.array(z.string()),
        skills: z.array(z.object({ name: z.string(), description: z.string() })),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "List rules and skills",
        readOnlyHint,
        openWorldHint,
      },
    },
    async () => {
      try {
        const [rules, skills] = await Promise.all([source.listRules(), source.listSkills()]);
        const structuredContent = { rules, skills, source: sourceInfo };

        const lines = [
          "## Rules",
          rules.length ? rules.map((rule) => `- ${rule}`).join("\n") : "_none_",
          "",
          "## Skills",
          skills.length
            ? skills.map((skill) => `- ${skill.name} — ${skill.description}`).join("\n")
            : "_none_",
        ];

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent,
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_rule ──────────────────────────────────────────────────────────────

  server.registerTool(
    "get_rule",
    {
      title: "Get rule content",
      description: "Get the content of a rule. Use a name from the `list` tool, e.g. 'android/MVI_RULES'.",
      inputSchema: {
        name: z.string().describe("Rule name in '<category>/<RULE_NAME>' form, e.g. 'android/MVI_RULES'"),
      },
      outputSchema: {
        name: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get rule content",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateRuleName(name);
        const content = await source.getRule(validName);
        return {
          content: [{ type: "text", text: content }],
          structuredContent: { name: validName, content, source: sourceInfo },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_skill ─────────────────────────────────────────────────────────────

  server.registerTool(
    "get_skill",
    {
      title: "Get skill instructions",
      description: "Get the instructions for a skill. Use a name from the `list` tool, e.g. 'create-feature-scaffold-screen'.",
      inputSchema: {
        name: z.string().describe("Skill name (kebab-case directory name), e.g. 'create-feature-scaffold-screen'"),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get skill instructions",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateSkillName(name);
        const skill = await source.getSkill(validName);
        return {
          content: [{ type: "text", text: skill.content }],
          structuredContent: {
            name: validName,
            description: skill.description,
            content: skill.content,
            source: sourceInfo,
          },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  return server;
}
