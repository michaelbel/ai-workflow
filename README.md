AI Workflow
=

[![last-commit](https://img.shields.io/github/last-commit/michaelbel/ai-workflow?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/ai-workflow/commits)
[![npm](https://img.shields.io/npm/v/@michaelbel/ai-workflow-mcp?style=for-the-badge&logo=npm&labelColor=3F464F)](https://www.npmjs.com/package/@michaelbel/ai-workflow-mcp)

Общий репозиторий с правилами, скиллами и MCP-сервером для AI-агентов.

## MCP-сервер

Предоставляет правила и скиллы AI-агентам в любом проекте. По умолчанию сервер читает встроенный
в npm-пакет снапшот `rules/`/`skills/` — работает офлайн, без GitHub и без сети. Сервер не привязан
к Claude: его можно подключить к Codex, Cursor, Gemini CLI, Kimi Code или любому другому
MCP-клиенту.

**Claude Code** — подключить глобально:

```bash
claude mcp add --global ai-workflow npx -- -y @michaelbel/ai-workflow-mcp
```

**Codex** — плагином:

```bash
codex plugin marketplace add michaelbel/ai-workflow
codex plugin add ai-workflow@ai-workflow
```

или вручную в `~/.codex/config.toml`:

```toml
[mcp_servers.ai-workflow]
command = "npx"
args = ["-y", "@michaelbel/ai-workflow-mcp"]
```

**Cursor** — плагином (манифест `.cursor-plugin/`) либо через `.mcp.json` репозитория.

**Kimi Code** — плагином:

```
/plugins install https://github.com/michaelbel/ai-workflow
```

**Gemini CLI** — расширением:

```bash
gemini extensions install https://github.com/michaelbel/ai-workflow
```

**Claude Code + hooks** — плагин `integrations/claude-code/` подключает MCP-сервер и набор
Claude Code-хуков (например, напоминание про `git stash` перед переключением веток) одной
командой:

```
/plugin marketplace add michaelbel/ai-workflow
/plugin install ai-workflow@ai-workflow
```

Подробности — в `integrations/claude-code/README.md`.

### Инструменты

| Инструмент  | Описание                                                                |
|-------------|--------------------------------------------------------------------------|
| `list`      | Список всех доступных имён правил и скиллов (с описаниями скиллов)       |
| `get_rule`  | Получить содержимое правила по имени вида `android/MVI_RULES`            |
| `get_skill` | Получить инструкции скилла по имени вида `create-mvi-feature`            |

Каждый вызов инструмента возвращает и человекочитаемый `content` (Markdown), и `structuredContent`
с тем же результатом в виде структуры:

```ts
list      -> { rules: string[], skills: { name: string, description: string }[], source: { kind: "bundled" | "github", ref: string } }
get_rule  -> { name: string, content: string, source: { kind, ref } }
get_skill -> { name: string, description: string, content: string, source: { kind, ref } }
```

Имена скиллов — простые kebab-case имена директорий, например `create-mvi-feature`, а не путь к
файлу (`create-mvi-feature/SKILL`). Имена правил — вида `<категория>/<ИМЯ_ПРАВИЛА>`, например
`android/MVI_RULES`.

При ошибке инструмент возвращает `isError: true` с телом
`{ code, message, retryable, details? }`, где `code` — один из фиксированных кодов: `INVALID_NAME`,
`NOT_FOUND`, `GITHUB_TIMEOUT`, `GITHUB_RATE_LIMITED`, `GITHUB_UNREACHABLE`, `RESPONSE_TOO_LARGE`,
`INVALID_SOURCE_REF`, `INTERNAL_ERROR`.

### Источник данных: bundled snapshot vs GitHub

По умолчанию (`bundled`, источник по умолчанию) сервер копирует `rules/` и `skills/` в
`mcp/assets/` на этапе сборки и публикует их вместе с npm-пакетом — `list`/`get_rule`/`get_skill`
читают этот снапшот без единого сетевого запроса. Обновление правил и скиллов происходит через
публикацию новой версии пакета (`mcp-vX.Y.Z`), а не «на лету».

Опционально сервер можно перевести в режим чтения напрямую с GitHub, установив переменную
окружения `AI_WORKFLOW_SOURCE=github`. Этот режим:

- никогда не читает mutable-ветку `main`/`master`; по умолчанию использует immutable-тег
  `mcp-v${версия_пакета}`;
- позволяет переопределить ref через `AI_WORKFLOW_GITHUB_REF`, но принимает только immutable-тег
  вида `mcp-v<semver>` или полный 40-символьный commit SHA — всё остальное отклоняется с
  `INVALID_SOURCE_REF`;
- поддерживает необязательный `GITHUB_TOKEN` (передаётся только в заголовке `Authorization`,
  никогда не попадает в логи или тексты ошибок);
- имеет таймаут ~10 секунд на запрос, ограниченные повторные попытки (только для сетевых сбоев,
  `429` и подходящих `5xx`, с учётом `Retry-After`), ограничение размера ответа, ограниченный
  TTL-кэш с устареванием и де-дупликацией параллельных запросов, а также stale-фолбэк на последний
  успешный ответ, если очередной запрос не удался.
- остаётся read-only, но помечен `openWorldHint: true`, так как обращается вовне.

## Разработка

Все команды выполняются в каталоге `mcp/`:

```bash
npm ci             # установить зависимости
npm run dev         # запустить сервер локально через tsx
npm run build         # собрать dist/ (включает copy-assets)
npm test         # юнит-тесты (node:test через tsx)
npm run validate         # статические проверки repo (frontmatter, drift-регрессии, симлинки, версии...)
npm run smoke         # stdio smoke-тест собранного сервера
npm run check         # validate + test + build + smoke + npm pack --dry-run
```

CI (`.github/workflows/ci.yml`) запускает этот же набор на каждый `pull_request` и `push` в
`main`. Публикация (`.github/workflows/publish.yml`) срабатывает только на тег вида `mcp-vX.Y.Z`,
проверяет, что тег совпадает с версией в `mcp/package.json` и достижим из `origin/main`, и
публикует пакет только после прохождения полного набора проверок.

## Правила

Хранятся в `rules/`. `git`, `github`, `project` подключены через `@`-импорты в `CLAUDE.md` — это
процессные правила, нужные в каждой сессии этого репозитория. `kotlin`, `compose`, `kmp`, `android`
— продукт, который репозиторий поставляет в другие проекты; в `CLAUDE.md` они не преинклюднуты и
читаются по требованию через MCP `list`/`get_rule`.

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

Хранятся в `skills/{name}/SKILL.md`. Каждый файл начинается с YAML-frontmatter с полями `name`
(совпадает с именем директории) и `description` (когда использовать скилл, характерные фразы
пользователя и какой соседний скилл выбрать вместо него в похожем сценарии).

- `add-string` — Добавляет строковый ресурс UI в проект.
- `create-alert-dialog` — Создаёт Compose-диалог проекта.
- `create-bottom-sheet` — Создаёт Compose bottom sheet проекта.
- `create-data-layer` — Создаёт или расширяет поток данных/domain проекта для фичи.
- `create-mvi-feature` — Создаёт MVI-экран фичи проекта.
- `create-nav-route` — Создаёт маршрут Navigation 3 для проекта.
- `create-shared-component` — Создаёт переиспользуемый общий UI-компонент.
- `create-usecase` — Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.
- `git-status` — Показывает текущий статус рабочего дерева в кратком формате.
