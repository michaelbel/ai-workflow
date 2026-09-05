#!/bin/bash
# Адаптирует существующий ~/.claude под второй чекаут cuckcoder (первый — рабочая копия для
# разработки, например ~/Projects/cuckcoder). Бэкапит текущий ~/.claude, инициализирует git,
# сбрасывает на origin/main. Локальное состояние (сессии, кэши, credentials) не в whitelist
# .gitignore и остаётся нетронутым — reset --hard трогает только tracked-пути.

set -euo pipefail

REPO="https://github.com/michaelbel/cuckcoder.git"
CLAUDE_DIR="$HOME/.claude"

skip_settings() {
  git -C "$CLAUDE_DIR" update-index --skip-worktree -- settings.json 2>/dev/null || true
}

add_csync_alias() {
  local rc=""
  case "${SHELL:-}" in
    */zsh)  rc="$HOME/.zshrc" ;;
    */bash) rc="$HOME/.bashrc" ;;
    *)
      echo "Add this alias to your shell profile manually:"
      echo '  alias csync="$HOME/.claude/hooks/sync-settings.sh"'
      return ;;
  esac
  if ! grep -q 'alias csync=' "$rc" 2>/dev/null; then
    echo 'alias csync="$HOME/.claude/hooks/sync-settings.sh"' >> "$rc"
    echo "Added csync alias to $rc. Run: source $rc"
  fi
}

echo "=== Cuckcoder Global Settings Setup ==="

# --- Already set up ---
if [ -d "$CLAUDE_DIR/.git" ]; then
  echo "Already configured. Syncing (ff-only)..."
  BRANCH=$(git -C "$CLAUDE_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
  if [ "$BRANCH" != "main" ]; then
    echo "Checkout is on '$BRANCH', not main — sync skipped. Switch to main, then run csync."
    exit 1
  fi
  git -C "$CLAUDE_DIR" fetch --quiet origin || { echo "Fetch failed (network?)."; exit 1; }
  if ! git -C "$CLAUDE_DIR" merge --ff-only origin/main; then
    echo "main diverged from origin — setup does not rebase. Run csync to deliver local work."
    exit 1
  fi
  skip_settings
  add_csync_alias
  echo "Done."
  exit 0
fi

# --- New machine, no ~/.claude yet ---
if [ ! -d "$CLAUDE_DIR" ]; then
  echo "Cloning into ~/.claude ..."
  git clone "$REPO" "$CLAUDE_DIR"
  skip_settings
  add_csync_alias
  echo "Done. Run 'claude' to start."
  exit 0
fi

# --- Existing ~/.claude, not yet a git checkout ---
echo "Found existing ~/.claude. Backing up..."

BACKUP_DIR="$HOME/.claude-backup-$(date +%Y%m%d-%H%M%S)"
cp -a "$CLAUDE_DIR" "$BACKUP_DIR"
echo "Full backup saved to $BACKUP_DIR"

cleanup_on_failure() {
  echo "Setup failed. Removing partial git state..."
  rm -rf "$CLAUDE_DIR/.git"
  echo "Your original files are intact. Backup at: $BACKUP_DIR"
}
trap cleanup_on_failure ERR

cd "$CLAUDE_DIR"
git init
git remote add origin "$REPO"
git fetch origin
git reset --hard origin/main
git branch -M main
git branch --set-upstream-to=origin/main main

trap - ERR

# Восстановить локальные файлы из бэкапа на случай, если они не пережили reset --hard.
for f in settings.local.json .credentials.json mcp-needs-auth-cache.json; do
  [ -f "$BACKUP_DIR/$f" ] && cp "$BACKUP_DIR/$f" "$CLAUDE_DIR/"
done

skip_settings
add_csync_alias
echo ""
echo "Done. Backup at: $BACKUP_DIR"
