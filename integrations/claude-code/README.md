# Claude Code integration

This directory is a placeholder for a future, entirely optional Claude Code plugin layer on top of
`mcp/`. Nothing here is wired into the MCP server, and nothing here is required to use it.

## Why hooks are a separate, Claude-specific layer

`mcp/` implements the [Model Context Protocol](https://modelcontextprotocol.io), a client-agnostic
transport. It is used from Claude Code, Codex, Cursor, Gemini CLI, and any other MCP-capable
client, and it must keep working identically for all of them. Claude Code hooks
(`PreToolUse`/`PostToolUse`/`UserPromptSubmit`/etc., configured in `.claude/settings.json` or a
Claude plugin manifest) are a **Claude Code-specific automation mechanism** — they don't exist as
a concept in the MCP spec, and no other MCP client understands or executes them.

Folding a hook into `mcp/` would mean either:

- silently doing nothing on every other client (dead code shipped to Codex/Cursor/Gemini CLI
  users), or
- making the core server's behavior depend on which client happens to be connected, which breaks
  the "one server, any MCP client" premise this repository is built on (see the top-level
  `README.md`).

Neither is acceptable, so hook logic — if it is ever built — belongs in a separate,
Claude Code-only package that *depends on* `mcp/` (as an MCP server it talks to), rather than
living inside it.

## Where a Claude plugin manifest would go

If/when a Claude Code plugin is built, it would live under this directory, for example:

```
integrations/claude-code/
  README.md          # this file
  plugin.json         # Claude Code plugin manifest (name, version, hooks, mcpServers, ...)
  hooks/         # hook scripts, one responsibility per script
```

It would declare `mcp/` as an MCP server dependency (the same way any other MCP client does —
`npx -y @michaelbel/ai-workflow-mcp`), not vendor or duplicate any of its code. It would ship its
own `package.json`, its own tests, and its own validation, entirely decoupled from
`mcp/package.json`'s version and release cycle (`mcp-v*` tags).

## Hooks that would plausibly be useful here (not implemented)

These are documented as candidates for a future iteration, not scaffolding that exists today:

- A `PreToolUse` hook on `Bash` that reminds the agent to call `get_rule` with
  `git/GIT_RULES` before a `git commit`, mirroring the MCP server's own `instructions` field but
  enforced locally instead of relied on as a suggestion.
- A `UserPromptSubmit` hook that nudges the agent toward `list`/`get_skill` when the prompt matches
  a skill's trigger phrases, as a faster path than the agent reasoning about which skill to use.

Both are deliberately **not implemented** here: a hook with no concrete, tested behavior is worse
than no hook, since it looks load-bearing without doing anything. Building either would need its
own design pass (what exactly triggers it, how failures are surfaced, how it's tested) — out of
scope for this hardening pass, which is about the core MCP server.

## What this directory is not

- It is not required to install or use `@michaelbel/ai-workflow-mcp`. The MCP server works the same
  whether or not this directory, or any Claude Code plugin built from it, exists.
- It does not contain any hook implementation today. If you're looking for why an agent following
  `rules/git/GIT_RULES.md` reads `AGENTS.md`/`CLAUDE.md` and calls `get_rule` before a commit, that
  behavior comes from the MCP server's `instructions` field and the agent's own reasoning — not
  from anything in this directory.
