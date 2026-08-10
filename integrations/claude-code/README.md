# Claude Code integration

A Claude Code plugin that installs two things together in one step:

- the `ai-workflow` MCP server (`npx -y @michaelbel/ai-workflow-mcp`), and
- the `ai-workflow` hook set (Claude Code-specific automation, e.g. a stash reminder before
  branch switches).

## Why hooks are a separate, Claude-specific layer

`mcp/` implements the [Model Context Protocol](https://modelcontextprotocol.io), a client-agnostic
transport. It is used from Claude Code, Codex, Cursor, Gemini CLI, and any other MCP-capable
client, and it must keep working identically for all of them. Claude Code hooks
(`PreToolUse`/`PostToolUse`/`UserPromptSubmit`/etc.) are a **Claude Code-specific automation
mechanism** — they don't exist as a concept in the MCP spec, and no other MCP client understands
or executes them. That's why hook logic lives here, in a separate package that *depends on* `mcp/`
as an MCP server it talks to, instead of living inside it.

## Structure

```
integrations/claude-code/
  README.md                    # this file
  .claude-plugin/
    plugin.json                # plugin manifest: points at ./.mcp.json; hooks/hooks.json is
                                # auto-discovered by convention, not referenced here
  .mcp.json                    # declares the ai-workflow MCP server (npx -y @michaelbel/ai-workflow-mcp)
  hooks/
    hooks.json                 # wires each hook script to a Claude Code event/matcher
    stash-reminder.sh          # PreToolUse:Bash — warns before switching branches with uncommitted changes
```

Everything a hook script needs lives inside this directory tree and is referenced via
`${CLAUDE_PLUGIN_ROOT}`. This is a hard Claude Code constraint, not a style choice: when the
plugin is installed from a marketplace, Claude Code copies only the plugin's own root directory
into `~/.claude/plugins/cache/`. A relative path pointing outside this directory (e.g. a shared
`../../hooks/` at the repo root) would never be copied and would fail to resolve after install —
so hook scripts are colocated here rather than at the repo root.

## Installing

**Via the marketplace** (this repo doubles as its own marketplace, `.claude-plugin/marketplace.json`
at the repo root):

```
/plugin marketplace add michaelbel/ai-workflow
/plugin install ai-workflow@ai-workflow
```

**Local development** (no marketplace, points straight at the working tree):

```
claude --plugin-dir ./integrations/claude-code
```

Either path registers the MCP server and the hook set together. Plain `claude mcp add` (see the
top-level `README.md`) only connects the MCP server — it's still the right choice for non-Claude
clients (Codex, Cursor, …) or for Claude Code users who want the rules/skills tools without the
hooks.

## Hooks

| Hook | Event | Behavior |
|---|---|---|
| `stash-reminder.sh` | `PreToolUse` on `Bash`, matching `git checkout`/`git switch` | Blocks (exit 2) if the working tree has uncommitted changes and the command doesn't already include `git stash`, so the agent confirms before switching branches instead of losing track of dirty state. |

Known limitation: the matcher is a substring/regex check on the raw command text, so it also fires
on `git checkout -- <file>` (restoring a file, not switching branches) — a legitimate false
positive inherited from keeping the check simple. Work around it with `git restore` instead of
`git checkout -- <file>` when that's what you mean.

## What this directory is not

- It is not required to install or use `@michaelbel/ai-workflow-mcp`. The MCP server works the same
  whether or not this plugin is installed — see the top-level `README.md` for the plain
  `claude mcp add` / `.mcp.json` connection.
- It is versioned and released independently of `mcp/package.json`'s npm release cycle
  (`mcp-v*` tags) — this plugin has no `version` field, so Claude Code tracks updates by git commit
  SHA instead of a manually bumped semver.
