#!/bin/bash
# name: dependency-bump-commit-guard
# description: Блокирует git commit, который бампает версии сразу нескольких зависимостей за раз.
# type: PreToolUse
# matcher: Bash

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — dependency-bump-commit-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if ! echo "$COMMAND" | grep -qE '(^|[;&|]\s*)git\s+commit\b'; then
    exit 0
fi

MANIFEST_GLOB='(^|/)(package\.json|package-lock\.json|.*\.versions\.toml|gradle\.properties|build\.gradle(\.kts)?|Cargo\.toml|Cargo\.lock|pyproject\.toml|requirements.*\.txt|go\.mod)$'

STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep -E "$MANIFEST_GLOB")
if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

DIFF=$(git diff --cached --unified=0 -- $STAGED_FILES 2>/dev/null)
if [ -z "$DIFF" ]; then
    exit 0
fi

echo "$DIFF" | python3 -c '
import re, sys

diff = sys.stdin.read()

PATTERN = re.compile(
    r"^([+-])\s*[\"\x27]?([A-Za-z0-9_.@/-]+)[\"\x27]?\s*[:=]\s*[\"\x27]?[\^~]?"
    r"(\d+(?:\.\d+){1,3}[\w.-]*)[\"\x27]?\s*,?\s*$"
)

removed, added = {}, {}
for line in diff.splitlines():
    if line.startswith(("+++", "---")):
        continue
    m = PATTERN.match(line)
    if not m:
        continue
    sign, key, version = m.groups()
    (removed if sign == "-" else added)[key] = version

bumped = sorted(k for k in added if k in removed and added[k] != removed[k])

if len(bumped) > 1:
    lines = ["%s: %s -> %s" % (k, removed[k], added[k]) for k in bumped]
    sys.stderr.write(
        "DEPENDENCY-BUMP-GUARD: staged-коммит бампает %d разных зависимостей за раз — "
        "заблокировано.\nrules/git.md требует один коммит на одно обновление "
        "(\"Bump <dependency> from <old> to <new>\").\n%s\n"
        "Разбей на отдельные `git add -p` + `git commit` на каждую зависимость, или "
        "выполни коммит сам (! prefix), если это осознанный массовый апдейт.\n"
        % (len(bumped), "\n".join(lines))
    )
    sys.exit(2)
sys.exit(0)
'
