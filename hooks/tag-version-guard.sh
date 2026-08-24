#!/bin/bash
# Tag/version consistency guard: PreToolUse на Bash, ловит создание/push тега вида
# mcp-vX.Y.Z и сверяет его с версией в mcp/package.json — той же проверкой, которую
# потом всё равно делает publish-workflow, но до того, как тег уже пошёл в CI.
#
# Считает только явные имена тегов (`git tag mcp-vX.Y.Z`, `git push origin mcp-vX.Y.Z` /
# `refs/tags/mcp-vX.Y.Z`); `git push --tags` без явного имени пропускает — не наша
# задача угадывать, какой из локальных тегов имелся в виду.

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — tag-version-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if ! echo "$COMMAND" | grep -qE '(^|[;&|]\s*)git\s+(tag|push)\b'; then
    exit 0
fi

TAG=$(echo "$COMMAND" | grep -oE 'mcp-v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ -z "$TAG" ]; then
    exit 0
fi

PACKAGE_JSON="mcp/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
    exit 0
fi

TAG_VERSION="${TAG#mcp-v}"
PKG_VERSION=$(python3 -c "import json; print(json.load(open('$PACKAGE_JSON')).get('version',''))" 2>/dev/null)

if [ -n "$PKG_VERSION" ] && [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
    echo "TAG-VERSION-GUARD: тег $TAG не совпадает с версией в $PACKAGE_JSON ($PKG_VERSION) — заблокировано." >&2
    echo "Обнови mcp/package.json до $TAG_VERSION (или поставь правильный тег $PKG_VERSION), либо выполни команду сам (! prefix)." >&2
    exit 2
fi

exit 0
