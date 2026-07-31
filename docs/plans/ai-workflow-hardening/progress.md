# AI Workflow Hardening — Прогресс

Журнал статусов, сначала самые свежие записи. Рабочая директория для этой работы — git worktree,
выделенный под эту задачу; ничего не закоммичено, не запушено, не помечено тегом и не опубликовано.

## Журнал

- Прочитаны `AGENTS.md` и все 29 импортируемых файлов rules, все 9 `skills/*/SKILL.md`, текущие
  `mcp/src/index.ts` и `mcp/src/github.ts`, `mcp/package.json`, `mcp/tsconfig.json`, существующие
  `.github/workflows/publish.yml`, `.github/CODEOWNERS`, `.github/FUNDING.yml`. Подтверждено, что рабочее
  дерево было чистым на старте (`git status --short` пустой) — сохранять от предыдущей незавершённой
  правки было нечего.
- Проведена ручная сверка каждого файла skill против каждого файла rule. Найдено и подтверждено (через
  точечный `grep`) ровно шесть точек drift сверх трёх, названных в задаче:
  - два дополнительных нарушения в `new-data-layer` (`withTransaction`, оборачивающий один вызов DAO;
    `select`, возвращающий non-null при названии для nullable-конвенции) — оба являются явными
    нарушениями `ROOM_RULES.md`, а не просто стилистическими предпочтениями.
  - два нарушения `LAZYLIST_RULES.md` в `new-bottom-sheet` (пустые строки между блоками `item {}`;
    `Spacer` нулевой высоты в середине списка).
  Дальнейших противоречий в `new-navigation-route`, `new-usecase`, `add-string` не найдено. В
  `new-shared-component` найден пробел неполного примера (отсутствуют импорты
  `ThemeWrapper`/`FontScalePreviews`), но это не противоречие правилу — зафиксировано как вне scope в
  `plan.md`.
- Подтверждено, что установленный `@modelcontextprotocol/sdk` разрешается в версию `1.29.0`
  (удовлетворяет существующему диапазону `^1.0.0` — апгрейд SDK не нужен) и поддерживает `registerTool`
  с `annotations` + `inputSchema` + `outputSchema`, а также что валидация `structuredContent`/output
  schema пропускается SDK при `isError: true`, что подтверждает: запланированная форма обработки ошибок
  работает с этой версией SDK как есть. Zod разрешается в `3.25.76` (всё ещё в рамках существующего
  диапазона зависимости `^3.22.0`).
- Локально доступен Node v25.8.1. План CI ориентирован на документированную минимально поддерживаемую
  версию Node плюс Node 24.
- Написаны `plan.md`, `tasks.md`, `progress.md`.

## Решения

- `@modelcontextprotocol/sdk` и `zod` оставлены в существующих semver-диапазонах (апгрейд не нужен — см.
  выше).
- Выбран `tsx` (уже devDependency) для запуска `scripts/*.ts` и наборов `node:test` напрямую, чтобы
  `scripts/validate.ts` мог напрямую импортировать `src/frontmatter.ts` и т. п., вместо дублирования
  логики парсинга в отдельном plain-JS скрипте.
- `SKILL_NAME_PATTERN` допускает `-` и `_` как разделители сегментов (не чистый kebab-case) специально,
  чтобы `new-alert_dialog` оставался валидным без переименования директории — задокументировано в
  `plan.md`.

## Реализация завершена

- Переписаны все 9 полей frontmatter `description` у skills (на английском, в форме "Use when ... Do not
  use ...; use X instead"); через вспомогательный скрипт проверено, что каждый `name:` совпадает со своей
  директорией и каждый description непустой и заметно короче лимита в 1024 символа (самый длинный —
  613 символов).
- Все шесть исправлений drift применены к реальным файлам `SKILL.md` (полное до/после каждого — в
  `plan.md`): `new-screen` ViewModel, `new-data-layer` entity/DAO/UseCase (три отдельных фикса),
  `new-alert_dialog` функция shape, `new-bottom-sheet` блоки item LazyList/Spacer.
- `mcp/src` пересобран с нуля: `version.ts`, `errors.ts`, `validation.ts`, `frontmatter.ts`, `server.ts`
  (тестируемая фабрика `createServer()`), `source/{types,bundled,github,github-source,cache,index}.ts`, и
  6-строчный entrypoint `index.ts`. Старый `mcp/src/github.ts` удалён (заменён на `source/github.ts` +
  `source/github-source.ts`), `execSync`/`run_skill` удалены полностью — через `grep` подтверждено
  отсутствие оставшихся упоминаний.
- Добавлены `mcp/scripts/copy-assets.ts`, `validate.ts`, `smoke.ts`; скрипты `mcp/package.json`
  перенастроены (`copy-assets`, `build`, `dev`, `typecheck`, `test`, `validate`, `smoke`, `check`,
  `prepack`, `prepare`); `files` теперь включает `assets/`; `mcp/.gitignore` получил `assets/`
  (генерируется, не коммитится — воспроизводится `copy-assets` при каждом build/dev/test/pack).
- Добавлено 63 теста `node:test` в 7 файлах тестов (`frontmatter`, `validation`, `errors`, `version`,
  `cache`, `source-bundled`, `source-github`, `source-index`, `server`) — все проходят. `server.test.ts`
  использует `InMemoryTransport.createLinkedPair()` + `Client` из SDK, чтобы проверить реальный путь
  MCP-протокола (tools/list, tools/call) без запуска процесса; `scripts/smoke.ts` отдельно покрывает
  реально запущенный `dist/index.js` через stdio.
- Добавлен `.github/workflows/ci.yml` (PR + push в `main`; матрица Node 20 и 24;
  validate/test/build/smoke/pack --dry-run + явная проверка, что упакованный tarball содержит
  `assets/rules/**/*.md`, `assets/skills/**/SKILL.md` и `dist/**/*.js`).
- `.github/workflows/publish.yml` переписан: триггер сужен только до тегов `mcp-v*` (было: любой тег);
  добавлена проверка равенства тега и версии в `package.json`, проверка достижимости через
  `merge-base --is-ancestor` относительно `origin/main` (с `fetch-depth: 0`), и полный gate
  validate/test/build/smoke/pack перед `npm publish`; permissions сужены до `contents: read`; ручная
  установка токена аутентификации npm registry заменена на `registry-url` из `actions/setup-node`
  (избегает построения командной строки, содержащей токен).
- Написан `integrations/claude-code/README.md`: объясняет, почему hooks — Claude-специфичный слой, где
  будет жить будущий plugin manifest, два кандидата (нереализованных) hooks, явно указано, что ни hooks,
  ни scaffold не добавлены.
- README.md переписан на месте (сохранён существующий префикс с бейджем/описанием согласно
  `GITHUB_README_RULES.md`): новая таблица инструментов (3 инструмента), migration note об удалении
  `run_skill`, формы structured-output, формат ошибок, раздел bundled-vs-GitHub источник, раздел
  «Разработка», перечисляющий каждый npm-скрипт, и заметка о том, что именно проверяют CI/publish.
- Прогнан полный цикл проверки из **чистого состояния** (`rm -rf mcp/node_modules mcp/dist mcp/assets`,
  затем `npm ci`): `npm ci` (сборка проходит через `prepare`), `npm run validate` (29 rules / 9 skills,
  все проверки проходят), `npm test` (63/63 проходят), `npm run build`, `npm run check`
  (validate + test + build + smoke + `npm pack --dry-run`, exit 0), отдельный `npm pack --dry-run`
  (51 файл, 42.5 kB, rules/skills/dist на месте). `git status --short` совпадает с ожидаемым набором
  изменённых файлов (всё под `skills/`, `mcp/`, `README.md`, `.github/workflows/`, плюс новые
  `docs/plans/...` и `integrations/claude-code/`); `git diff --check` ничего не сообщает.
- Одна итерация над самим `scripts/validate.ts` в ходе этой работы: первая версия регрессионной проверки
  `withTransaction` была простым сравнением подстроки, которое давало ложное срабатывание на новом тексте
  правила, добавленном мной ("Внедряй `AppDatabase` и используй `database.withTransaction { ... }` только
  когда...") — ужесточена до regex, соответствующего именно проблемной форме кода (`withTransaction {`
  сразу за которым идёт один вызов DAO). Аналогично проверка «нет run_skill» в README была простым
  сравнением подстроки, которое давало ложное срабатывание на собственной migration note README,
  объясняющей *почему* `run_skill` был удалён — ужесточена так, чтобы соответствовать только строке
  markdown-таблицы (`| \`run_skill\` |`), чтобы предложение о задокументированном удалении не срабатывало
  как ошибка, а недокументированное повторное появление в таблице инструментов — срабатывало.
- Отмечено, но не устранено: `npm ci` сообщает о 6 существовавших ранее уязвимостях (2 low/2 moderate/2
  high) в транзитивных зависимостях *неизменённого* набора зависимостей (`@modelcontextprotocol/sdk`,
  `zod`, `@types/node`, `tsx`, `typescript`) — новых runtime-зависимостей эта работа не добавляла, так что
  это существовавшее ранее состояние репозитория, а не регрессия; исправление вне scope этой работы
  (потребовало бы апгрейда зависимости, который задача не запрашивала).
