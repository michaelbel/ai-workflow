# AI Workflow Hardening — Задачи

Каждая задача должна быть проверяема независимо. Отмечай выполнение в `progress.md`, а не здесь.

## 1. Description у skills (раздел 2)
- [x] 1.1 Написать маршрутизационный `description` (триггеры + антитриггеры + соседний skill) для каждого
      из 9 блоков frontmatter `skills/*/SKILL.md`; `name:` должен совпадать с именем директории.

## 2. Исправление drift rules/skills (раздел 3)
- [x] 2.1 `new-screen`: инлайнить обработку `LoadData` в `dispatch`, использовать `launch` базового класса,
      удалить импорты `viewModelScope` / `kotlinx.coroutines.launch` и `private fun loadData()`.
- [x] 2.2 `new-data-layer`: `@Entity(primaryKeys = ["id"])` вместо `@PrimaryKey`, удалить импорт
      `androidx.room.PrimaryKey`.
- [x] 2.3 `new-data-layer`: перестать оборачивать одиночный вызов `upsert` в `database.withTransaction`;
      удалить ставший ненужным параметр конструктора `AppDatabase` и импорт
      `androidx.room.withTransaction`.
- [x] 2.4 `new-data-layer`: сделать `{Feature}Dao.select(id)` возвращающим `{Feature}Entity?`, чтобы
      соответствовать имени.
- [x] 2.5 `new-alert_dialog`: `optionItemShape` становится функцией с block body и `return when { ... }`.
- [x] 2.6 `new-bottom-sheet`: удалить пустые строки между соседними блоками `item {}` и удалить элемент
      `Spacer` нулевой высоты.
- [x] 2.7 Ручной аудит остальных 6 skills против всех 29 файлов rules на предмет дополнительного drift
      (зафиксировано в `plan.md`; сверх перечисленного выше противоречий не найдено — один пробел отмечен
      как вне scope).

## 3. Обработка имён в MCP (раздел 4)
- [x] 3.1 `validation.ts`: `validateSkillName` / `validateRuleName`, отклонение path traversal, приём
      deprecated-алиаса `<name>/SKILL` только для skills.
- [x] 3.2 `list` возвращает простые имена директорий skills (`new-screen`), а не `new-screen/SKILL`.
- [x] 3.3 `get_skill({ name: "new-screen" })` читает `skills/new-screen/SKILL.md`.

## 4. Удаление небезопасного выполнения (раздел 5)
- [x] 4.1 Удалить инструмент `run_skill` и импорт/использование `execSync` из `mcp/src`.
- [x] 4.2 Удалить поле frontmatter `command:` из `skills/git-status/SKILL.md`.
- [x] 4.3 Публичная поверхность инструментов — ровно `list`, `get_rule`, `get_skill`.

## 5. Bundled-снэпшот / неизменяемый источник (раздел 6)
- [x] 5.1 `scripts/copy-assets.ts` копирует `rules/` + `skills/` в `mcp/assets/`.
- [x] 5.2 `package.json#files` включает `assets/`; `npm pack --dry-run` показывает наличие файлов
      rules/skills.
- [x] 5.3 `source/bundled.ts` — источник `WorkflowSource` по умолчанию, без сетевых вызовов.
- [x] 5.4 Опциональный режим `source/github.ts` включается флагом `AI_WORKFLOW_SOURCE=github`; default ref
      — `mcp-v${packageVersion}`; `AI_WORKFLOW_GITHUB_REF` проверяется по allow-list тег/SHA.

## 6. Единый источник версии (раздел 7)
- [x] 6.1 `version.ts` читает `mcp/package.json` во время выполнения; `server.ts` использует его для
      `serverInfo.version`.
- [x] 6.2 В `server.ts`/`index.ts` не осталось литеральной строки semver.
- [x] 6.3 Тест проверяет `packageJson.version === serverInfo.version`.

## 7. Контракты MCP (раздел 8)
- [x] 7.1 `registerTool` (не устаревший `tool()`) используется для всех 3 инструментов с `annotations` +
      `inputSchema` + `outputSchema`.
- [x] 7.2 `structuredContent` возвращается вместе с `content`, оба строятся из одного общего объекта
      результата.

## 8. Единый формат ошибок (раздел 9)
- [x] 8.1 `errors.ts`: `WorkflowError` + фиксированный union `code` + `toToolErrorResult`.
- [x] 8.2 Каждый обработчик инструмента обёрнут так, что ни одно исключение не выходит необработанным.

## 9. Усиление GitHub-клиента (раздел 10)
- [x] 9.1 Timeout через `AbortController`, ограниченный retry (только 429/5xx/transport), поддержка
      `Retry-After`.
- [x] 9.2 Ограничения размера ответа (tree / file).
- [x] 9.3 Ограниченный по размеру TTL-кэш с дедупликацией запросов и stale fallback.
- [x] 9.4 Заголовок `GITHUB_TOKEN`, `User-Agent`, `Accept`; никогда не логируется.

## 10. Скрипт валидации (раздел 11)
- [x] 10.1 `scripts/validate.ts` реализует все проверки, перечисленные в задаче; подключён к
      `npm run validate`.

## 11. Тесты (раздел 12)
- [x] 11.1 Unit-тесты согласно стратегии тестирования из `plan.md`.
- [x] 11.2 Stdio smoke-тест `scripts/smoke.ts`; подключён к `npm run smoke`.

## 12. CI (раздел 13)
- [x] 12.1 `.github/workflows/ci.yml` на PR + push в `main`.
- [x] 12.2 npm-скрипты: `build`, `test`, `validate`, `check`, `smoke`.

## 13. Усиление publish (раздел 14)
- [x] 13.1 `publish.yml`: триггер только на теги `mcp-v*`, проверка тег == `mcp-v${packageVersion}`,
      проверка достижимости коммита тега из `origin/main`, полный gate перед `npm publish`, минимальные
      permissions.

## 14. Claude-специфичный слой (раздел 15)
- [x] 14.1 `integrations/claude-code/README.md` документирует разделение; hooks не реализованы.

## 15. README (раздел 16)
- [x] 15.1 Переписать README в соответствии с фактическим поведением (инструменты, формат имён, bundled по
      умолчанию, опциональный GitHub-режим, команды разработки, CI, процесс релиза, отсутствие
      shell-исполнения).

## 16. Финальная проверка (раздел 17)
- [x] 16.1 Из чистого состояния: `npm ci && npm run validate && npm test && npm run build && npm run
      check && npm pack --dry-run`.
- [x] 16.2 Проверены `git status --short` / `git diff --check`; посторонние изменения не затронуты.
