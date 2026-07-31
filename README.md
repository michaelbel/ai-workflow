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

**android**
- `ARCHITECTURE_RULES` — Правила архитектуры
- `DOMAIN_RULES` — Правила Domain
- `MVI_ERROR_HANDLING_RULES` — Правила обработки ошибок в MVI
- `MVI_RULES` — Правила MVI
- `MVI_STATE_RULES` — Правила Model в MVI
- `NAVIGATION_RULES` — Правила навигации
- `NETWORK_RULES` — Правила сети
- `RESOURCE_RULES` — Правила ресурсов
- `ROOM_RULES` — Правила Room
- `USECASE_RULES` — Правила UseCase

**compose**
- `BOTTOM_SHEET_RULES` — Правила Bottom Sheet
- `COMPOSE_COLOR_RULES` — Правила цвета Compose
- `COMPOSE_CONSTRAINTLAYOUT_RULES` — Правила ConstraintLayout
- `COMPOSE_RULES` — Правила Compose
- `COMPOSE_SCREEN_RULES` — Правила Compose-экранов
- `COMPOSE_SPACING_RULES` — Правила отступов и размеров Compose
- `DIALOG_RULES` — Правила Dialog
- `LAZYLIST_RULES` — Правила LazyList
- `PREVIEW_RULES` — Правила Preview
- `SCAFFOLD_RULES` — Правила Scaffold
- `SHIMMER_RULES` — Правила Shimmer / Loading Placeholder
- `TYPOGRAPHY_RULES` — Правила типографики

**git**
- `GIT_RULES` — Правила Git

**github**
- `GITHUB_README_RULES` — Правила GitHub README
- `GITHUB_REPO_RULES` — Правила структуры репозитория

**kmp**
- `KMP_RULES` — Правила KMP

**kotlin**
- `KOTLIN_RULES` — Правила Kotlin

**project**
- `FILESYSTEM_RULES` — Правила проекта
- `WORKFLOW_RULES` — Правила рабочего процесса

## Скиллы

Хранятся в `skills/`. Каждый скилл — файл `.md` с опциональным полем `command:` во frontmatter для `run_skill`.

- `add-string` — Добавляет строковый ресурс UI в проект.
- `git-status` — Показывает текущий статус рабочего дерева в кратком формате.
- `new-alert_dialog` — Создаёт Compose-диалог проекта.
- `new-bottom-sheet` — Создаёт Compose bottom sheet проекта.
- `new-data-layer` — Создаёт или расширяет поток данных/domain проекта для фичи.
- `new-navigation-route` — Создаёт маршрут Navigation 3 для проекта.
- `new-screen` — Создаёт MVI-экран фичи проекта.
- `new-shared-component` — Создаёт переиспользуемый общий UI-компонент.
- `new-usecase` — Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.
