#!/bin/bash
# name: stash-reminder
# description: Блокирует git checkout/switch при незакоммиченных изменениях и просит подтверждения.
# type: PreToolUse
# matcher: Bash

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — stash-reminder cannot parse tool input, skipping check" >&2
fi

COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if ! echo "$COMMAND" | grep -qE 'git\s+(checkout|switch)\s'; then
    exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+stash'; then
    exit 0
fi

DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIRTY_COUNT" -gt 0 ]; then
    DIRTY_FILES=$(git status --porcelain 2>/dev/null | head -5)
    echo "STASH REMINDER: You have $DIRTY_COUNT uncommitted change(s) and are about to switch branches." >&2
    echo "$DIRTY_FILES" >&2
    if [ "$DIRTY_COUNT" -gt 5 ]; then
        echo "  ...and $((DIRTY_COUNT - 5)) more files" >&2
    fi
    echo "" >&2
    echo "Consider running 'git stash' or committing before switching." >&2
    echo "Please confirm you want to proceed." >&2
    exit 2
fi

exit 0
