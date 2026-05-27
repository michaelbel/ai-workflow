AI Workflow
=

A shared repository for AI agent rules, skills, and MCP server.

## MCP Server

Provides rules and skills to Claude Code agents in any project.

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ai-workflow": {
      "command": "npx",
      "args": ["-y", "@michaelbel/ai-workflow-mcp"]
    }
  }
}
```

### Tools

| Tool | Description |
|---|---|
| `list` | List all available rules and skills |
| `get_rule` | Get the content of a rule |
| `get_skill` | Get the instructions for a skill |
| `run_skill` | Run a skill's associated shell command |

## Rules

Stored in `rules/`. Referenced via `@`-imports in `CLAUDE.md`.

## Skills

Stored in `skills/`. Each skill is a `.md` file with optional `command:` in frontmatter for `run_skill`.
