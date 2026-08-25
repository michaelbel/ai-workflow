# Repository Guidelines

@rules/git.md
@rules/github-readme.md
@rules/github-repo.md
@rules/filesystem.md
@rules/workflow.md

## Личные инструкции

- Если в промпте пользователя есть очевидная опечатка (пропущенная, лишняя или переставленная
  буква, при которой замысел читается однозначно), исправляй её автоматически и продолжай работу
  без уточняющего вопроса. Не сообщай об исправлении отдельно — просто действуй так, будто опечатки
  не было. Уточняющий вопрос уместен только тогда, когда возможных прочтений несколько и не ясно,
  какое из них верное.

## Kotlin, Compose, KMP, Android rules

The Kotlin, Compose, KMP, and Android rule files in `rules/` are the product this repo distributes
to consumer projects; they are not preloaded here. Before reading, editing, or cross-checking one
of these rule files, call the `ai-workflow` MCP `list` tool to see all rule names, then `get_rule`
to fetch the ones relevant to the task at hand.
