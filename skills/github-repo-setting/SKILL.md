---
name: github-repo-setting
description: >-
  Use when the user asks to apply the standard GitHub repository setup — a short project
  description, a few relevant topics, and turning off Releases/Packages/Deployments on the home
  page plus Wikis/Issues/Discussions/Projects/Pull requests in Settings — or says "configure my
  github repo", "set up repo settings", "add topics to my repo". Documents which parts run
  through `gh repo edit` and which are UI-only toggles with no API/CLI support as of 2026, so
  those must be done by hand in the browser. This skill only describes the commands, it does not
  execute them — run them yourself with your own terminal/shell tool, and do the UI-only steps
  in the browser. Do not use this for changes that live in tracked files, such as README.md,
  FUNDING.yml, or CODEOWNERS; follow rules/github/GITHUB_REPO_RULES.md and
  rules/github/GITHUB_README_RULES.md for those instead.
---

# Настройка GitHub-репозитория

Стандартная настройка репозитория после создания: описание, topics, отключение лишних функций. Ничего из этого не трогает файлы самого репозитория.

Все команды выполняются от имени `OWNER/REPO`; при работе в текущей директории репозитория `OWNER/REPO` можно опустить — `gh` определит его сам.

## Через `gh repo edit` (автоматизируется)

```bash
gh repo edit OWNER/REPO \
  --description "Краткое описание проекта" \
  --add-topic topic1 --add-topic topic2 \
  --enable-wiki=false \
  --enable-issues=false \
  --enable-discussions=false \
  --enable-projects=false
```

- `--description` — краткое описание проекта.
- `--add-topic` — повторяй флаг для каждого relevant topic (`--remove-topic`, чтобы убрать лишний).
- `--enable-wiki=false` / `--enable-issues=false` / `--enable-discussions=false` / `--enable-projects=false` — снимают галочки Wikis, Issues, Discussions, Projects в Settings → General → Features.

Проверить текущее состояние:

```bash
gh repo view OWNER/REPO --json description,repositoryTopics,hasWikiEnabled,hasIssuesEnabled,hasDiscussionsEnabled,hasProjectsEnabled
```

## Вручную в браузере (API/CLI пока не поддерживают)

- **Settings → General → Features → Pull requests** — сними галочку, чтобы полностью отключить Pull Requests. Функция появилась в GitHub в феврале 2026 и пока не имеет параметра ни в REST/GraphQL API, ни в `gh repo edit` (открытый запрос: github.com/orgs/community/discussions/188621).
- **Главная страница репозитория → шестерёнка рядом с «About» → Include in the home page** — сними галочки Releases, Packages, Deployments. Тоже без публичного API (открытый запрос: github.com/cli/cli/issues/8755).

Кнопку Sponsor `gh` тоже включить не может — это отдельный переключатель UI (Settings → General → Sponsorships), см. rules/github/GITHUB_REPO_RULES.md.
