#!/bin/bash
# Auto-sync ~/.claude on session start: fast-forward local main from origin. PULL-ONLY.
#
# Модель: правки в ~/.claude доставляет csync (commit -> rebase -> push, hooks/sync-settings.sh).
# Этот хук только подтягивает: он никогда не коммитит и не пушит. Грязный или ahead main — обычное
# рабочее состояние, сообщается информационно, а не как об аварии.

set -uo pipefail

REPO="$HOME/.claude"

cd "$REPO" 2>/dev/null || exit 0

# Не в git-репозитории (репозиторий ещё не адаптирован через setup.sh) — тихо выходим.
git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || exit 0
git -C "$REPO" remote get-url origin >/dev/null 2>&1 || exit 0

note() { printf '[claude-sync] %s\n' "$*"; }

# Подчистить зависшее состояние rebase от прошлого сбоя.
if [ -d "$REPO/.git/rebase-merge" ] || [ -d "$REPO/.git/rebase-apply" ]; then
  git -C "$REPO" rebase --abort 2>/dev/null || true
fi

BRANCH=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
if [ "$BRANCH" != "main" ]; then
  note "checkout on '$BRANCH', not main — pull skipped"
  exit 0
fi

if ! git -C "$REPO" fetch --quiet origin 2>/dev/null; then
  note "offline — sync state unverified"
  exit 0
fi

if ! git -C "$REPO" diff --quiet 2>/dev/null || ! git -C "$REPO" diff --cached --quiet 2>/dev/null; then
  note "main has uncommitted changes — pull skipped, run csync to deliver"
  exit 0
fi

AHEAD=$(git -C "$REPO" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$AHEAD" -gt 0 ]; then
  note "main is $AHEAD commit(s) ahead of origin — run csync to push"
  exit 0
fi

BEHIND=$(git -C "$REPO" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
if [ "$BEHIND" -gt 0 ]; then
  if git -C "$REPO" merge --ff-only --quiet origin/main 2>/dev/null; then
    note "synced (pulled $BEHIND)"
  else
    note "fast-forward failed — local main diverged from origin, resolve manually"
  fi
fi

exit 0
