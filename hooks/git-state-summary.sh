#!/bin/bash
# name: git-state-summary
# description: Печатает в начале сессии текущую ветку, worktree'ы и незакоммиченные изменения.
# type: SessionStart
# matcher: —

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

echo ""
echo "=== GIT STATE ==="
echo "Current branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"

if git rev-parse --git-dir 2>/dev/null | grep -qE '/\.git/worktrees/'; then
    echo "Is worktree: yes"
else
    echo "Is worktree: no"
fi

DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
echo "Default branch: ${DEFAULT:-(unknown -- run: git remote set-head origin --auto)}"

DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "Uncommitted changes: $DIRTY_COUNT"
if [ "$DIRTY_COUNT" -gt 0 ]; then
    git status --porcelain 2>/dev/null | head -10
    if [ "$DIRTY_COUNT" -gt 10 ]; then
        echo "  ...and $((DIRTY_COUNT - 10)) more files"
    fi
fi

WORKTREES=$(git worktree list 2>/dev/null | tail -n +2)
if [ -n "$WORKTREES" ]; then
    echo "Other worktrees:"
    echo "$WORKTREES"
fi

LOCAL_BRANCHES=$(git branch 2>/dev/null | grep -vE '^\*?\s*(main|master|develop)$' | sed 's/^[* ]*//' | head -20)
if [ -n "$LOCAL_BRANCHES" ]; then
    echo "Local feature branches:"
    echo "$LOCAL_BRANCHES"
fi

echo "================="
echo ""
exit 0
