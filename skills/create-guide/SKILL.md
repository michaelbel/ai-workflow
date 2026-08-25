---
name: create-guide
description: >-
  Use when пользователь просит создать практический Android-гайд по конкретному API или теме,
  который публикуется как связанная пара артефактов: рабочий публичный GitHub-репозиторий и
  объясняющая страница в Notion — например "создай гайд по Navigation3", "сделай гайд про
  EyeDropper", "напиши гайд по Paging 3 с RemoteMediator". Проводит исследование по первичным
  источникам, создаёт и проверяет Android-проект из актуального `MyApplication`, пишет или
  обновляет страницу Notion в data source `POSTS` и публикует оба артефакта. Не используй для
  обычной фичи, экрана или доработки в уже существующем прикладном проекте — для этого есть
  `create-feature-scaffold-screen` и другие `create-*` skills. Не используй, если нужен только
  пустой Android-проект без исследования и без Notion-страницы — для этого есть
  `create-project-from-template`.
metadata:
  author: michaelbel
---

# Создание гайда: Android-проект + Notion-страница

Каждый гайд состоит из двух связанных артефактов: рабочего Android-проекта в отдельном публичном
GitHub-репозитории и страницы в Notion, которая объясняет API и ссылается на точные файлы проекта.
Если страница уже существует, обновляй только её и не переноси между базами. Если страницы нет, по
умолчанию создавай её в data source `POSTS`, если пользователь явно не указал другое место.

Это единственное место, где живёт эта функциональность. Не создавай и не поддерживай для неё
отдельный репозиторий или второй skill.

## Обязательный контекст

Перед работой:

1. прочитай [references/guide-defaults.yaml](references/guide-defaults.yaml) — личные дефолты
   (owner, package prefix, шаблон `MyApplication`, data source Notion `POSTS`);
2. прочитай [references/existing-guides.yaml](references/existing-guides.yaml) как каталог уже
   изданных гайдов — не создавай дубликат уже изданной темы, обнови существующий репозиторий и
   страницу вместо этого;
3. загрузи актуальные Kotlin/Compose/Git/GitHub правила из `michaelbel/ai-workflow` через MCP
   `ai-workflow`;
4. изучи актуальную ветку `michaelbel/MyApplication` перед созданием Android-проекта.

`ai-workflow` определяет общий Kotlin, Compose, Git и GitHub-стиль. Этот skill определяет процесс
создания гайда. Если правила конфликтуют именно в вопросах исследования, структуры учебного
проекта, публикации или валидации гайда, применяй этот skill.

## Команда пользователя

Минимальный запрос:

```text
Создай гайд по Navigation3
```

Не заставляй пользователя заполнять анкету. Сам выбери значения из
[references/guide-defaults.yaml](references/guide-defaults.yaml) и зафиксируй их в манифесте.
Задавай вопрос только тогда, когда неоднозначность заметно меняет тему, объём или публичный
результат.

## Порядок работы

### 1. Определи границы темы

Зафиксируй прямо в этом контексте:

- основной API;
- связанные компоненты;
- статус API: stable, alpha, experimental или platform;
- минимальную версию Android и библиотек;
- вопросы, которые должен закрыть гайд;
- подходящий тип проекта: `catalog`, `scenario` или `single` (см.
  [references/android-project.md](references/android-project.md)).

### 2. Проведи исследование

Приоритет источников — [references/research.md](references/research.md):

1. официальная документация;
2. исходный код AndroidX или Android Open Source Project;
3. официальные samples;
4. release notes;
5. issue tracker;
6. сторонние статьи только как дополнительный контекст.

Для AndroidX зафиксируй точный ref или commit SHA и пути к изученным файлам (правила атрибуции —
[references/androidx.md](references/androidx.md)). Не считай существующий гайд из
`existing-guides.yaml` техническим источником истины.

Создай директорию `~/Projects/<Topic>` (PascalCase, sibling к `MyApplication` и остальным гайдам)
и в ней рабочие файлы:

- `.guidekit/manifest.yaml` — из [templates/guide-manifest.yaml](templates/guide-manifest.yaml);
- `.guidekit/research.md` — по структуре из
  [references/research.md](references/research.md#research-report);
- `.guidekit/implementation-plan.md` — из
  [templates/implementation-plan.md](templates/implementation-plan.md).

Сначала заполни манифест и план, затем переходи к реализации.

### 3. Реализуй и провалидируй Android-проект

Делегируй фоновому агенту, чтобы Gradle-логи и весь код не засоряли этот контекст:

```
Agent(subagent_type: "guide-android-builder")
```

Передай в промпте: полный `.guidekit/manifest.yaml`, `.guidekit/implementation-plan.md` и
абсолютный путь `~/Projects/<Topic>`. Этот агент сам вызовет skill `create-project-from-template`
для scaffold из актуального `MyApplication`, реализует сценарии и прогонит обязательные Gradle-
проверки. Не публикуй и не пиши Notion-страницу, пока этот агент не вернул успешный результат.

### 4. Напиши страницу Notion

Только после успешной валидации Android-проекта делегируй:

```
Agent(subagent_type: "guide-writer")
```

Передай в промпте: `.guidekit/manifest.yaml`, путь/URL репозитория, реализованные сценарии и
краткий summary от `guide-android-builder`. Страница пишется только на основе проверенного
проекта — примеры кода, имена классов, версии, package и ссылки должны совпадать с репозиторием.

### 5. Проведи перекрёстную проверку

В этом контексте, по [references/validation.md](references/validation.md), сверь:

- все заявленные сценарии реализованы;
- каждый путь из Notion существует в GitHub;
- каждый большой фрагмент кода в Notion совпадает с проектом;
- версии зависимостей совпадают;
- experimental API помечены;
- заимствования из AndroidX атрибутированы;
- ссылки открываются;
- README и Notion не противоречат друг другу.

### 6. Опубликуй

Порядок публикации — [references/github.md](references/github.md):

1. создай публичный GitHub-репозиторий (`gh repo create`, owner `michaelbel`) и запушь
   проверенный проект;
2. обнови существующую страницу Notion или подтверди новую в data source `POSTS`;
3. добавь в Notion ссылки на репозиторий и точные samples;
4. при необходимости добавь ссылку на Notion в README;
5. запусти skill `github-repo-settings` для приведения репозитория к стандартному состоянию
   (description, topics, disabled Wikis/Issues/Discussions/Projects/PRs, Sponsorships);
6. повторно проверь публичные URL.

Не останавливайся перед этим шагом для отдельного подтверждения — публикация автономна, но
финальный отчёт обязан явно перечислить, что было опубликовано.

## Обязательный финальный отчёт

Полный формат — [references/output-contract.md](references/output-contract.md). Кратко: URL
GitHub-репозитория, URL страницы Notion, тип проекта, версии ключевых библиотек, список
реализованных сценариев, результаты Gradle-проверок, основные первичные источники, известные
ограничения. Не пиши «успешно», если проверка не запускалась.

## Запреты

- Не выдумывай API, версии, параметры и поведение.
- Не вставляй в Notion код, которого нет в проекте.
- Не копируй AndroidX-код без фиксации происхождения и лицензии.
- Не добавляй Clean Architecture, DI, многомодульность, Room или сеть без необходимости.
- Не публикуй черновой проект вместо рабочего примера.
- Не заменяй выбранный API альтернативной библиотекой без согласования.
- Не сохраняй токены, Notion IDs, пароли и другие секреты в Git.
- Не создавай дубликат уже изданной темы из `existing-guides.yaml` — обновляй существующий
  репозиторий и страницу.
