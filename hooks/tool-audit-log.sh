#!/bin/bash
# Tool-audit log: PostToolUse на все инструменты ("*"), пишет по одной JSON-строке
# на каждый вызов инструмента для последующего разбора/compliance.
#
# Лог общий для пользователя (не в рабочем дереве проекта — не тащить его в коммиты
# и не плодить конфликты), с ротацией по дням. Крупные поля (например new_string у
# Edit) обрезаются, чтобы файл не разрастался за одну сессию с большими правками.
#
# Fail-open: нет python3, нет доступа на запись — просто ничего не пишем, вызов
# инструмента это не блокирует (лог не должен ронять рабочий процесс).

LOG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/ai-workflow/audit"
mkdir -p "$LOG_DIR" 2>/dev/null || exit 0
LOG_FILE="$LOG_DIR/$(date -u +%Y-%m-%d).jsonl"

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    exit 0
fi

TOOL_AUDIT_INPUT="$INPUT" python3 - >>"$LOG_FILE" 2>/dev/null <<'PYEOF'
import json, os, sys, datetime

try:
    payload = json.loads(os.environ.get("TOOL_AUDIT_INPUT") or "{}")
except Exception:
    sys.exit(0)

LIMIT = 2000

def truncate(value):
    if isinstance(value, str) and len(value) > LIMIT:
        return value[:LIMIT] + "...[truncated %d chars]" % (len(value) - LIMIT)
    if isinstance(value, dict):
        return {k: truncate(v) for k, v in value.items()}
    if isinstance(value, list):
        return [truncate(v) for v in value]
    return value

entry = {
    "ts": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "session_id": payload.get("session_id"),
    "cwd": payload.get("cwd"),
    "hook_event": payload.get("hook_event_name"),
    "tool_name": payload.get("tool_name"),
    "tool_input": truncate(payload.get("tool_input")),
    "tool_response": truncate(payload.get("tool_response")),
}
print(json.dumps(entry, ensure_ascii=False))
PYEOF

exit 0
