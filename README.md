Cuckcoder
=

[![last-commit](https://img.shields.io/github/last-commit/michaelbel/cuckcoder?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/cuckcoder/commits)
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
codex plugin marketplace add michaelbel/cuckcoder
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
/plugins install https://github.com/michaelbel/cuckcoder
```

**Gemini CLI** — расширением:

```bash
gemini extensions install https://github.com/michaelbel/cuckcoder
```

**Claude Code** — корень репозитория одновременно является корнем плагина. Плагин подключает
MCP-сервер, нативные `skills/` и `agents/`, а также Claude Code hooks одной командой:

```
/plugin marketplace add michaelbel/cuckcoder
/plugin install ai-workflow@ai-workflow
```

Для локальной разработки плагин можно подключить напрямую из рабочей копии:

```bash
claude --plugin-dir .
```

Hooks:
- `stash-reminder.sh` срабатывает перед `git checkout`/`git switch` и предупреждает о
  незакоммиченных изменениях.
- `destructive-guard.sh` блокирует катастрофические Bash-команды (рекурсивное удаление
  корня/системных путей/домашней директории, форматирование ФС, запись поверх блочного
  устройства, fork bomb, pipe скачанного кода в shell, `git push --force` без
  `--force-with-lease`).
- `secret-read-guard.sh` блокирует Bash-команды, читающие или пересылающие секретные пути
  (`.env`, `secrets/`, `~/.ssh`, `~/.aws`, приватные ключи и сертификаты).
- `dependency-bump-commit-guard.sh` блокирует `git commit`, который бампает версии сразу
  нескольких зависимостей за раз (`rules/git.md` требует один коммит на одно обновление).
- `agents-frontmatter-guard.sh` после правки `agents/*.md`/`.claude/agents/*.md` проверяет
  `model:` из допустимого набора, отсутствие `effort:` у `haiku` и существование скиллов
  из `skills:`.
- `worktree-merge-back-reminder.sh` напоминает после закрытия worktree перенести изменения
  как незакоммиченные и перепроверить их в основной директории, не коммитя автоматически.
- `tool-audit-log.sh` пишет JSONL-лог каждого вызова инструмента в
  `~/.claude/ai-workflow/audit/` (с ротацией по дням) для последующего разбора/compliance.
- `git-state-summary.sh` печатает в начале сессии текущую ветку, worktree'ы и
  незакоммиченные изменения.
- `tag-version-guard.sh` и `typecheck-on-edit.sh` — dev-tooling именно для разработки этого
  репозитория (сверяют тег `mcp-vX.Y.Z` с `mcp/package.json` и гоняют `tsc --noEmit` по
  `mcp/src`); в остальных проектах, где стоит плагин, молча ничего не делают.

### Инструменты

| Инструмент  | Описание                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| `list`      | Список всех доступных имён правил и скиллов (с описаниями скиллов)        |
| `get_rule`  | Получить содержимое правила по имени вида `mvi`                           |
| `get_skill` | Получить инструкции скилла по имени вида `create-feature-scaffold-screen` |

Каждый вызов инструмента возвращает и человекочитаемый `content` (Markdown), и `structuredContent`
с тем же результатом в виде структуры:

```ts
list      -> { rules: string[], skills: { name: string, description: string }[], source: { kind: "bundled" | "github", ref: string } }
get_rule  -> { name: string, content: string, source: { kind, ref } }
get_skill -> { name: string, description: string, content: string, source: { kind, ref } }
```

Имена скиллов — простые kebab-case имена директорий, например `create-feature-scaffold-screen`, а не путь к
файлу (`create-feature-scaffold-screen/SKILL`). Имена правил — простые имена файлов без расширения и
категории, например `mvi`.

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

Все файлы правил лежат непосредственно в `rules/`, без промежуточных директорий. Процессные правила
Git, GitHub и проекта подключены через `@`-импорты в `CLAUDE.md`. Правила Kotlin, Compose, KMP и
Android — продукт, который репозиторий поставляет в другие проекты; они читаются по требованию через
MCP `list`/`get_rule`.

- `architecture` — Правила архитектуры
- `bottom-sheet` — Правила Bottom Sheet
- `compose-color` — Правила цвета Compose
- `compose-constraintlayout` — Правила ConstraintLayout
- `compose` — Правила Compose
- `compose-screen` — Правила Compose-экранов
- `compose-spacing` — Правила отступов и размеров Compose
- `dialog` — Правила Dialog
- `domain` — Правила Domain
- `filesystem` — Правила проекта
- `github-readme` — Правила GitHub README
- `github-repo` — Правила структуры репозитория
- `git` — Правила Git
- `kmp` — Правила KMP
- `kotlin` — Правила Kotlin
- `lazylist` — Правила LazyList
- `mvi-error-handling` — Правила обработки ошибок в MVI
- `mvi` — Правила MVI
- `mvi-state` — Правила Model в MVI
- `navigation` — Правила навигации
- `network` — Правила сети
- `preview` — Правила Preview
- `realtime` — Правила realtime-соединений
- `resource` — Правила ресурсов
- `room` — Правила Room
- `scaffold` — Правила Scaffold
- `shimmer` — Правила Shimmer / Loading Placeholder
- `textfield` — Правила TextField
- `typography` — Правила типографики
- `usecase` — Правила UseCase
- `workmanager` — Правила WorkManager
- `workflow` — Правила рабочего процесса

## Скиллы

Хранятся в `skills/{name}/SKILL.md`. Каждый файл начинается с YAML-frontmatter с полями `name`
(совпадает с именем директории) и `description` (когда использовать скилл, характерные фразы
пользователя и какой соседний скилл выбрать вместо него в похожем сценарии).

- `create-data-layer` — Собирает составной поток данных/domain из атомарных скиллов.
- `create-datastore-preference` — Создаёт типизированную настройку Preferences DataStore.
- `create-domain-mapper` — Создаёт KTX-маппер между network, Room и domain-моделями.
- `create-feature-alert-dialog` — Создаёт Compose-диалог проекта.
- `create-feature-bottom-sheet` — Создаёт Compose bottom sheet проекта.
- `create-feature-scaffold-screen` — Создаёт MVI-экран фичи проекта.
- `create-ktor-endpoint` — Создаёт Ktor endpoint и transport-модели.
- `create-notification-flow` — Создаёт поток локальных или push-уведомлений Android.
- `create-offline-outbox` — Создаёт durable offline-очередь мутаций через Room, WorkManager и Ktor.
- `create-paging-flow` — Создаёт Paging 3 pipeline для Room, network или RemoteMediator.
- `create-project-from-template` — Создаёт и оформляет новый Android-проект из `MyApplication`.
- `create-room-storage` — Создаёт законченную единицу Room-хранилища.
- `create-shared-component` — Создаёт переиспользуемый общий UI-компонент.
- `create-signalr-channel` — Создаёт SignalR realtime-канал и подключает его к session lifecycle.
- `create-usecase` — Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.
- `create-workmanager-task` — Создаёт WorkManager worker и use case планирования/отмены.
- `github-repo-settings` — Пошагово применяет и проверяет стандартные настройки GitHub-репозитория.
