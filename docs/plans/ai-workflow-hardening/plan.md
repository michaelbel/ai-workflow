# AI Workflow Hardening — План

## Текущее состояние (до этой работы)

`mcp/src/index.ts` создаёт единый `McpServer` inline и регистрирует четыре инструмента:

- `list` — получает полное git-дерево с `https://api.github.com/repos/michaelbel/ai-workflow/git/trees/main?recursive=1`
  (без аутентификации, без timeout, без retry, без кэша) и вычисляет имена rules/skills, отбрасывая
  префиксы `rules/`/`skills/` и суффикс `.md`. Поскольку skills лежат по пути `skills/<name>/SKILL.md`,
  вычисленное имя skill получается `new-screen/SKILL`, а не `new-screen`.
- `get_rule` — получает `https://raw.githubusercontent.com/michaelbel/ai-workflow/main/rules/<name>.md`.
- `get_skill` — получает `https://raw.githubusercontent.com/michaelbel/ai-workflow/main/skills/<name>.md`,
  что на самом деле неверный путь (реальный путь — `skills/<name>/SKILL.md`); сейчас это работает только
  потому, что ни один клиент не передаёт исправленное имя.
- `run_skill` — получает markdown skill, регуляркой извлекает поле frontmatter `command:`, конкатенирует
  строкой опциональные `args`, переданные вызывающим, и передаёт результат в `execSync`. Это примитив
  произвольного выполнения shell-команд: любой вызывающий, способный повлиять на `args`, или любой будущий
  skill, чьё поле `command:` берётся из менее доверенного контента, может выполнить произвольные
  shell-команды на хосте, где запущен MCP-сервер.
- Все три инструмента чтения данных всегда читают из **изменяемой ветки `main`** — закреплённого ref нет,
  поэтому ответы сервера могут меняться между двумя вызовами в рамках одной сессии, а компрометированный
  или случайный push в `main` немедленно отдаётся каждому подключённому агенту.
- `McpServer` создаётся с захардкоженной `version: "1.0.0"`, тогда как `mcp/package.json` содержит реальную
  опубликованную версию (`1.6.4` на момент написания). Эти два числа уже расходятся.
- Регистрация инструментов использует устаревшую перегрузку `server.tool(name, description, schema, cb)`
  без `annotations`, без `outputSchema` и без `structuredContent` — клиенты получают только свободный
  текст.
- Нет тестов, нет CI workflow, нет `npm run validate` и нет проверки реального расхождения между
  `rules/*.md` и `skills/*/SKILL.md` (на начало этой работы существовало три известных противоречия; см.
  «Исправленный известный drift rules/skills» ниже).
- `.github/workflows/publish.yml` публикует пакет по **любому** push тега без валидации, без gate
  build/test перед `npm publish` и без проверки формата тега.

## Решаемые проблемы

1. Поля frontmatter `description` у skills фактически пустые/неинформативные, поэтому у агента, выбирающего
   между skills, нет никакого маршрутизационного сигнала кроме имени файла.
2. `list`/`get_skill` показывают внутренний артефакт структуры файлов `<name>/SKILL` вместо логического
   имени skill.
3. `run_skill` — это примитив удалённого выполнения кода на базе `execSync`, получающий данные из markdown
   и строк, переданных вызывающим — этого не должно быть в сервере, которому доверяют другие клиенты
   (Codex, Cursor, Gemini CLI, ...).
4. Все чтения по умолчанию идут из изменяемой ветки `main` — нет воспроизводимости, нет офлайн-режима, нет
   защиты от того, что push в `main` в процессе сессии изменит ответы.
5. `version` у `McpServer` — вручную поддерживаемый литерал, который уже расходится с `package.json`.
6. Нет тестов, нет CI, нет скрипта валидации — регрессии (включая три известных противоречия rules/skills)
   незаметны, пока человек не заметит, что сгенерированный код нарушает правило.
7. Путь получения данных через GitHub (оставлен как опциональный режим) не имеет timeout, retry, ограничения
   размера ответа, кэша и слил бы `GITHUB_TOKEN` в сообщения об ошибках, если бы токен когда-либо был
   добавлен неаккуратно.
8. `publish.yml` публикует по любому тегу без gate.

## Выбранная архитектура

```
mcp/
  src/
    index.ts          // тонкий entrypoint: createServer() + StdioServerTransport, больше ничего
    server.ts          // фабрика createServer(deps?) — тестируемая, без логики transport/connect
    version.ts          // определяет версию сервера из mcp/package.json во время выполнения (единый источник)
    errors.ts          // WorkflowError + toToolErrorResult() — единый общий формат ошибок
    validation.ts          // validateSkillName / validateRuleName (allow-list kebab-case, без traversal)
    frontmatter.ts          // минимальный парсер frontmatter, общий для сервера и scripts/validate.ts
    source/
      types.ts          // интерфейс WorkflowSource + типы SourceInfo/SkillSummary
      bundled.ts          // читает mcp/assets/{rules,skills} (снэпшот, упакованный в npm) — default, без сети
      github.ts          // GithubClient: усиленный HTTP-клиент — timeout, retry, кэш, dedup, stale fallback, токен в заголовке
      github-source.ts          // GithubSource: адаптер WorkflowSource поверх GithubClient
      cache.ts          // ограниченный по размеру TTL-кэш + дедупликация параллельных запросов, используется github.ts
      index.ts          // createSource(env) — выбирает bundled или github, валидирует AI_WORKFLOW_GITHUB_REF
  scripts/
    copy-assets.ts          // rules/ + skills/ репозитория -> mcp/assets/ (запускается перед build/dev/test/pack)
    validate.ts          // `npm run validate` — статические проверки по всему репозиторию, см. tasks.md
    smoke.ts          // запускает собранный сервер через stdio, делает initialize + tools/list, проверяет форму ответа
  test/
    *.test.ts          // наборы node:test (source, validation, errors, server, github client, version)
```

Rules и skills поставляются как **снэпшот, упакованный в npm-пакет**: `mcp/scripts/copy-assets.ts`
копирует директории `rules/` и `skills/` репозитория в `mcp/assets/` перед каждым build, dev-запуском,
test-прогоном и pack. `mcp/assets/` перечислен в `package.json#files` вместе с `dist/`, поэтому
`npm pack`/`npm publish` встраивает ровно те rules/skills, что были актуальны для этой версии сервера.
`list`, `get_rule` и `get_skill` по умолчанию читают из этого bundled-снэпшота и работают с **нулевым
доступом к сети**.

Опциональный удалённый режим на базе GitHub оставлен под флагом `AI_WORKFLOW_SOURCE=github` (никогда не
default). Он никогда не указывает на `main`: ref по умолчанию — неизменяемый тег `mcp-v${packageVersion}`,
а любой ref, переданный через `AI_WORKFLOW_GITHUB_REF`, перед использованием проверяется по allow-list
(тег `mcp-v<semver>` или 40-символьный hex commit SHA) — всё остальное отклоняется с кодом
`INVALID_SOURCE_REF`.

`run_skill` и `execSync` полностью удалены, а не заменены другим shell-примитивом. У агента уже есть
собственный terminal-инструмент; задача MCP-сервера ограничена отдачей текста (rules/skills), но никогда
не его выполнением.

## Изменения публичного API

- **Удалённый инструмент**: `run_skill` (breaking change — см. migration note в README и
  `integrations/claude-code/README.md`).
- **Переименованные идентификаторы**: имена skills, возвращаемые `list`/принимаемые `get_skill`, меняются
  с `new-screen/SKILL` на `new-screen`. Старая форма `<name>/SKILL` принимается `get_skill` как
  deprecated-алиас (отбрасывается перед валидацией), но никогда не появляется в выводе `list`.
- **Форма ответа `list`** меняется с единого markdown-блока на:
  ```ts
  { rules: string[], skills: { name: string; description: string }[], source: { kind: "bundled" | "github"; ref: string } }
  ```
  и отдаётся одновременно как человекочитаемый `content` (markdown, та же информация) и как
  `structuredContent`, соответствующий указанной форме.
- **Форма ответа `get_rule` / `get_skill`** получает `structuredContent`:
  ```ts
  get_rule  -> { name: string; content: string; source: { kind; ref } }
  get_skill -> { name: string; description: string; content: string; source: { kind; ref } }
  ```
- **Аннотации инструментов**: `list`, `get_rule`, `get_skill` объявляют `readOnlyHint: true`.
  `openWorldHint` равен `false` в bundled-режиме и `true` в GitHub-режиме (фиксируется один раз при
  старте процесса сервера, поскольку режим источника выбирается один раз из переменных окружения).
- **Формат ошибок**: при любом сбое инструмент теперь возвращает `isError: true` с текстовым блоком
  `content`, несущим JSON-payload `{ code, message, retryable, details? }` из фиксированного набора
  `code` (см. `errors.ts`). Ни одно необработанное исключение не может выйти за пределы обработчика
  инструмента и уронить процесс.
- **Версия сервера**: `serverInfo.version` читается из `mcp/package.json` при старте; второго литерала,
  который нужно синхронизировать вручную, больше нет.

## Исправленный известный drift rules/skills

- `skills/new-screen/SKILL.md`: `ViewModel` использовал `viewModelScope.launch` внутри приватного
  хелпера `loadData()`. `rules/android/MVI_RULES.md` запрещает вспомогательные функции в ViewModel и
  требует, чтобы вызов use case и `reduce` находились непосредственно в соответствующей ветке `dispatch`
  с использованием общего `launch` базового класса. Исправлено: вызов инлайнится в ветку `LoadData`, а
  ставшие ненужными импорты `viewModelScope` / `kotlinx.coroutines.launch` удалены (базовый MVI
  ViewModel уже предоставляет `launch`).
- `skills/new-data-layer/SKILL.md`: три отдельных расхождения с `rules/android/ROOM_RULES.md`:
  1. `{Feature}Entity` использовал `@PrimaryKey val id: String`; `ROOM_RULES.md` требует вместо этого
     `@Entity(primaryKeys = [...])`. Исправлено, ставший ненужным импорт `androidx.room.PrimaryKey`
     удалён.
  2. `Load{Feature}UseCase` оборачивал **один** вызов `{feature}Dao.upsert(...)` в
     `database.withTransaction { ... }`. `ROOM_RULES.md` явно запрещает оборачивать один вызов DAO в
     транзакцию. Исправлено вызовом метода DAO напрямую, ставшая ненужной зависимость конструктора
     `AppDatabase` и импорт `androidx.room.withTransaction` удалены.
  3. `{Feature}Dao.select(id)` возвращал non-null `{Feature}Entity`, при этом называясь `select` (а не
     `selectNotNull`). Конвенция именования в `ROOM_RULES.md` резервирует `select` за nullable-формой.
     Исправлено сделав тип возврата nullable (`{Feature}Entity?`), что соответствует фактически
     используемому имени.
- `skills/new-alert_dialog/SKILL.md`: `private fun optionItemShape(...) = when { ... }` использовал
  expression body. `rules/kotlin/KOTLIN_RULES.md` требует, чтобы каждая функция использовала block body
  с явным `return`. Исправлено на `private fun optionItemShape(...): Shape { return when { ... } }`.
- `skills/new-bottom-sheet/SKILL.md`: два расхождения с `rules/compose/LAZYLIST_RULES.md`:
  1. Пустые строки разделяли соседние блоки `item { ... }` внутри `SharedLazyColumn`; правило прямо
     запрещает пустые строки между соседними блоками `item {}`. Исправлено их удалением.
  2. Лишний `item { Spacer(modifier = Modifier.height(0.dp)) }` находился в середине списка (Spacer
     нулевой высоты без визуального эффекта, при этом не в конце списка, как того требует правило для
     явного завершающего `Spacer`). Удалён — он не выполнял никакой функции и нарушал правило «только в
     конце».

### Осознанное, задокументированное решение одной неоднозначности

`rules` нигде не фиксирует точный регэксп для «kebab-case» имён skills, а одна реальная директория skill —
`new-alert_dialog` — не является чистым kebab-case (содержит подчёркивание, отражая Android-конвенцию
именования пакета `alert_dialog`). Переименование этой директории было вне scope (это было бы breaking
переименование существующего skill, а не исправление содержимого rules/skills). Поэтому
`SKILL_NAME_PATTERN` в `validation.ts` — это `^[a-z0-9]+(?:[-_][a-z0-9]+)*$`: сегменты из строчных
букв/цифр, разделённые `-` или `_`, по-прежнему отклоняющий слэши, точки, `..`, заглавные буквы и пробелы
(path traversal невозможен), но принимающий все существующие имена директорий skills без изменений. Это
зафиксировано здесь согласно инструкции задачи — исправлять реальные противоречия, но при неоднозначности
правила выбирать одно задокументированное поведение, а не оставлять две несовместимые инструкции.

## Риски и их снижение

| Риск | Снижение риска |
|---|---|
| Удаление `run_skill` ломает существующего вызывающего, полагавшегося на него | Это был неаутентифицированный RCE-примитив; сохранять его — неприемлемый компромисс. Задокументировано как breaking change с migration note (использовать собственный terminal-инструмент для `git status` и т.п.) в README и `integrations/claude-code/README.md`. |
| Bundled-снэпшот устаревает относительно актуальных `rules/`/`skills/` в HEAD | Задокументировано как ожидаемое поведение: обновления поставляются через новую версию npm-пакета (тег `mcp-v$X.Y.Z` + publish). `scripts/copy-assets.ts` детерминирован и перезапускается при каждой сборке, поэтому упакованный снэпшот всегда соответствует собранному коммиту. |
| GitHub remote-режим случайно снова указывает на изменяемый ref | `createSource()` отклоняет любой `AI_WORKFLOW_GITHUB_REF`, не являющийся `mcp-v<semver>` или 40-символьным hex commit SHA; вычисляемый default — `mcp-v${packageVersion}`, никогда не `main`/`master`. |
| GitHub-клиент зависает или заваливает API запросами | Timeout через `AbortController` (10с), максимум 3 попытки, retry только для transport-ошибок/429/5xx, поддержка `Retry-After`, ограниченный по размеру TTL-кэш, дедупликация параллельных запросов, stale-fallback при ошибке. |
| Утечка токена | `GITHUB_TOKEN` помещается исключительно в заголовок запроса `Authorization`; payload в `errors.ts` строится из статических сообщений/кодов, никогда из сырых значений заголовков, и покрыт unit-тестом на отсутствие строки токена. |
| Расхождение версий возвращается после этого фикса | `version.ts` разрешает `mcp/package.json` по пути файла относительно запущенного модуля (одинаково работает для `tsx src/index.ts` и `dist/index.js`); `test/version.test.ts` проверяет `serverInfo.version === packageJson.version`; `scripts/validate.ts` как статический бэкстоп ищет захардкоженный semver-литерал в `server.ts`/`index.ts`. |
| Регрессии возвращают исправленный drift rules/skills | `scripts/validate.ts` кодирует каждый исправленный drift как строковую/regex-проверку конкретного файла `SKILL.md` (см. tasks.md); это детерминированные проверки, а не семантическое понимание Markdown, и они опираются на зафиксированный выше ручной аудит. |

## Стратегия тестирования

- **Unit-тесты** (`node:test`, запускаются через `tsx --test`, без новой зависимости test framework):
  - `version.test.ts` — версия сервера разрешается из `package.json`.
  - `validation.test.ts` — принятые/отклонённые имена skill и rule, включая попытки path traversal и
    deprecated-алиас `name/SKILL`.
  - `frontmatter.test.ts` — парсинг `name`/`description`, включая свёрнутый (`>-`) YAML-скаляр.
  - `errors.test.ts` — форма `toToolErrorResult`, и что ошибка с примесью `GITHUB_TOKEN` никогда не
    содержит строку токена.
  - `source-bundled.test.ts` — `list()`/`getRule()`/`getSkill()` против реального снэпшота `mcp/assets`
    **без сети** (проверяется тем, что `fetch` не мокается и утверждается, что глобальный `fetch` не
    вызывается); количества совпадают с фактическим числом файлов на диске (не захардкожены 29/9 —
    вычисляются из тех же директорий, что читает source).
  - `source-github.test.ts` — `fetch` мокается (`node:test`'s `t.mock` / ручной stub); покрывает timeout,
    retry после 429, retry после 5xx, отсутствие retry после 404, ограничение размера ответа, cache hit,
    истечение кэша, дедупликацию запросов, stale fallback, и то, что `GITHUB_TOKEN` передаётся как
    заголовок и никогда не появляется в брошенной ошибке.
  - `server.test.ts` — сервер собран через фабрику `createServer()` (без transport): список инструментов
    состоит ровно из `list`, `get_rule`, `get_skill` (и явно не содержит `run_skill`); у каждого
    инструмента есть `readOnlyHint`, `openWorldHint`, `inputSchema`, `outputSchema`; `get_skill("new-screen")`
    и deprecated `get_skill("new-screen/SKILL")` возвращают идентичный контент; неизвестное имя даёт
    `NOT_FOUND`; path traversal (`../../etc/passwd`, `..%2f..`) даёт `INVALID_NAME`; `structuredContent`
    соответствует `content` для `list`.
  - Регрессионные тесты, проверяющие, что каждый исправленный выше drift больше не появляется в
    соответствующем `SKILL.md` (строковые/regex-проверки, запускаются и как `node:test`, и внутри
    `scripts/validate.ts`).
- **Smoke-тест** (`scripts/smoke.ts`, запускается как `npm run smoke` и из CI): запускает
  `node dist/index.js` через stdio, отправляет `initialize`, затем `tools/list`, проверяет наличие трёх
  имён инструментов, аннотаций и schemas, затем корректно завершает дочерний процесс.
- **Статическая валидация** (`npm run validate`, `scripts/validate.ts`): форма frontmatter/длина
  description для всех 9 skills, `name` == имя директории, все импорты `@rules/...` из `AGENTS.md`
  разрешаются, `CLAUDE.md`/`GEMINI.md` являются симлинками на `AGENTS.md`, отсутствие `execSync` /
  `run_skill` где-либо под `mcp/src`, таблица инструментов в README соответствует инструментам, реально
  зарегистрированным в `server.ts`, и перечисленные выше конкретные регрессии drift rules/skills.

## Явно вне scope

- Переименование директории skill `new-alert_dialog` в чистый kebab-case (задокументировано выше как
  осознанное решение с минимальным blast radius вместо этого).
- Любые Claude Code hooks, plugin manifest или автоматизация — `integrations/claude-code/README.md`
  документирует, *почему* это отдельный будущий слой и от чего он будет зависеть, но ни один hook не
  реализован.
- npm provenance / OIDC publish attestation — `publish.yml` усилен (валидация тега, проверки перед
  публикацией, минимальные permissions), но provenance не добавлен, поскольку это требует конфигурации
  registry/организации вне контроля этого репозитория. Отмечено комментарием в `publish.yml`.
- Переписывание примера preview в `new-shared-component` для добавления (сейчас отсутствующих) импортов
  `ThemeWrapper` / `FontScalePreviews` — это неполный пример, а не *противоречие* rules/skills (ни одно
  правило не говорит иначе), поэтому оставлено как заметка ручного аудита, а не обработано как drift,
  требующий регрессионного теста.
- Фактическое создание git-тега `mcp-v*` или публикация в npm — прямо запрещено задачей.
