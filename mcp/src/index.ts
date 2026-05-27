#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "child_process";
import { z } from "zod";
import { fetchFile, listTree } from "./github.js";

const OWNER = "michaelbel";
const REPO = "ai-workflow";
const BRANCH = "main";

const server = new McpServer({
  name: "@michaelbel/ai-workflow-mcp",
  version: "1.0.0",
});

// ─── list ────────────────────────────────────────────────────────────────────

server.tool(
  "list",
  "List all available rules and skills in the ai-workflow repository",
  {},
  async () => {
    const tree = await listTree(OWNER, REPO, BRANCH);

    const rules = tree
      .filter((f) => f.startsWith("rules/") && f.endsWith(".md"))
      .map((f) => `- ${f.replace(/^rules\//, "").replace(/\.md$/, "")}`);

    const skills = tree
      .filter((f) => f.startsWith("skills/") && f.endsWith(".md"))
      .map((f) => `- ${f.replace(/^skills\//, "").replace(/\.md$/, "")}`);

    const lines = [
      "## Rules",
      rules.length ? rules.join("\n") : "_none_",
      "",
      "## Skills",
      skills.length ? skills.join("\n") : "_none_",
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── get_rule ─────────────────────────────────────────────────────────────────

server.tool(
  "get_rule",
  "Get the content of a rule. Use the name from the `list` tool (e.g. 'git/GIT_RULES').",
  { name: z.string().describe("Rule name without extension, e.g. 'git/GIT_RULES'") },
  async ({ name }) => {
    const content = await fetchFile(OWNER, REPO, BRANCH, `rules/${name}.md`);
    return { content: [{ type: "text", text: content }] };
  }
);

// ─── get_skill ────────────────────────────────────────────────────────────────

server.tool(
  "get_skill",
  "Get the instructions for a skill. Use the name from the `list` tool.",
  { name: z.string().describe("Skill name without extension, e.g. 'deploy'") },
  async ({ name }) => {
    const content = await fetchFile(OWNER, REPO, BRANCH, `skills/${name}.md`);
    return { content: [{ type: "text", text: content }] };
  }
);

// ─── run_skill ────────────────────────────────────────────────────────────────

server.tool(
  "run_skill",
  "Run the shell command associated with a skill. The skill must have a `command:` field in its YAML frontmatter.",
  {
    name: z.string().describe("Skill name without extension"),
    args: z.string().optional().describe("Optional extra arguments appended to the command"),
  },
  async ({ name, args }) => {
    const content = await fetchFile(OWNER, REPO, BRANCH, `skills/${name}.md`);

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {
        content: [{ type: "text", text: `Skill '${name}' has no frontmatter — nothing to run.` }],
      };
    }

    const commandMatch = frontmatterMatch[1].match(/^command:\s*(.+)$/m);
    if (!commandMatch) {
      return {
        content: [{ type: "text", text: `Skill '${name}' has no 'command:' field in frontmatter.` }],
      };
    }

    const command = commandMatch[1].trim() + (args ? ` ${args}` : "");
    try {
      const output = execSync(command, { encoding: "utf8", stdio: "pipe" });
      return { content: [{ type: "text", text: output || "(no output)" }] };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error running '${command}':\n${msg}` }],
        isError: true,
      };
    }
  }
);

// ─── start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
