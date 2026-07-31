AI Workflow
=

[![last-commit](https://img.shields.io/github/last-commit/michaelbel/ai-workflow?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/ai-workflow/commits)
[![npm](https://img.shields.io/npm/v/@michaelbel/ai-workflow-mcp?style=for-the-badge&logo=npm&labelColor=3F464F)](https://www.npmjs.com/package/@michaelbel/ai-workflow-mcp)

Общий репозиторий с правилами, скиллами и MCP-сервером для AI-агентов.

## MCP-сервер

Предоставляет правила и скиллы агентам Claude Code в любом проекте. Данные всегда актуальны — сервер читает напрямую с GitHub.

**Claude Code** — подключить глобально:

```bash
claude mcp add --global ai-workflow npx -- -y @michaelbel/ai-workflow-mcp
```

**Codex** — добавить в `~/.codex/config.toml`:

```toml
[mcp_servers.ai-workflow]
command = "npx"
args = ["-y", "@michaelbel/ai-workflow-mcp"]
```

### Инструменты

| Инструмент  | Описание                                |
|-------------|-----------------------------------------|
| `list`      | Список всех доступных правил и скиллов  |
| `get_rule`  | Получить содержимое правила             |
| `get_skill` | Получить инструкции скилла              |
| `run_skill` | Запустить команду из frontmatter скилла |

## Правила

Хранятся в `rules/`. Подключаются через `@`-импорты в `CLAUDE.md`.

## Скиллы

Хранятся в `skills/`. Каждый скилл — файл `.md` с опциональным полем `command:` во frontmatter для `run_skill`.
