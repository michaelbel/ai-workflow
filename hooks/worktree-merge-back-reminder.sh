#!/bin/bash
# name: worktree-merge-back-reminder
# description: Напоминает после закрытия worktree перенести изменения как незакоммиченные и перепроверить их в основной директории.
# type: PostToolUse
# matcher: ExitWorktree

echo "WORKTREE-MERGE-BACK: worktree закрыт. Перед коммитом — rules/workflow.md:" >&2
echo "  1) перенеси изменения из worktree в основную директорию как uncommitted" >&2
echo "  2) НЕ коммить автоматически" >&2
echo "  3) перепрогони validate/test/build уже в основной директории" >&2

exit 2
