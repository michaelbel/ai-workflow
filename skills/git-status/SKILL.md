---
name: git-status
description: >-
  Use when the user asks what changed in the working tree, wants a quick pre-commit check, or
  says "git status", "what's changed", "what's staged", "any untracked files". Documents that
  the check is `git status --short` and how to read its output (staged/modified/untracked).
  This skill only describes the command; it does not execute it — run `git status --short`
  yourself with your own terminal/shell tool. Do not use this for creating a commit; follow
  rules/git/GIT_RULES.md directly for that instead.
metadata:
  author: michaelbel
---

# Статус Git

Показывает, как быстро проверить текущий статус рабочего дерева в кратком формате.

Выполни `git status --short` своим терминальным инструментом, чтобы увидеть, какие файлы изменены, добавлены в индекс или не отслеживаются, перед коммитом. Этот скилл только описывает команду и формат вывода — MCP-сервер не выполняет команды.
