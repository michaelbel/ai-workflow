#!/bin/bash
# csync — синхронизация ~/.claude с origin/main. Usage: csync
# Запускается из post-commit хука в ~/Projects/cuckcoder после каждого коммита в main;
# также доступен вручную как алиас csync.
#
# Модель: правки идут прямо в main и коммитятся вручную. csync ребейзит локальные
# коммиты на origin/main и пушит. Незакоммиченное дерево синк пропускает, не трогая его.

set -uo pipefail

REPO="$HOME/.claude"

# Репозиторий ещё не адаптирован через setup.sh (SessionStart на новой машине) — тихо выходим.
[ -d "$REPO" ] || exit 0
git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || exit 0
git -C "$REPO" remote get-url origin >/dev/null 2>&1 || exit 0

set -e

LOCK="/tmp/.claude-sync.lock"
exec 9>"$LOCK"
perl -e 'use Fcntl qw(:flock); open(F, ">&=9"); flock(F, LOCK_EX|LOCK_NB) or die' 2>/dev/null \
  || { echo "Another csync is running."; exit 1; }

cd "$REPO"

# Подчистить зависшее состояние rebase от прошлого сбоя.
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  git rebase --abort 2>/dev/null || true
fi

# csync синхронизирует только main.
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
if [ "$BRANCH" != "main" ]; then
  echo "⚠ Not on main (on '$BRANCH'). csync only syncs main; switch to main first."
  exit 1
fi

# Fetch — сетевой сбой громкий, не тихий.
git fetch --quiet origin || { echo "Fetch failed (network?)."; exit 1; }

# csync больше не делает авто-коммитов: незакоммиченную работу коммить вручную.
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "Uncommitted changes in $REPO — commit them, then rerun. Nothing synced."
  exit 0
fi

# Ребейз на origin/main. Конфликт останавливает громко — это решение, а не деталь синхронизации.
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
if [ "$BEHIND" -gt 0 ]; then
  if ! git rebase --quiet origin/main; then
    git rebase --abort 2>/dev/null || true
    echo "⚠ Rebase onto origin/main hit a conflict — resolve manually, csync changed nothing."
    exit 1
  fi
  echo "Rebased onto origin/main (was $BEHIND behind)."
fi

# Пушим то, что накопилось.
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$AHEAD" -gt 0 ]; then
  git push --quiet origin main && echo "Pushed $AHEAD commit(s)." || { echo "Push failed."; exit 1; }
else
  echo "Up to date."
fi
