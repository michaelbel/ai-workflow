#!/bin/bash
# name: secret-read-guard
# description: Блокирует Bash-команды, читающие или пересылающие секретные пути (.env, secrets/, ~/.ssh, приватные ключи и сертификаты).
# type: PreToolUse
# matcher: Bash

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — secret-read-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

SECRET_GUARD_INPUT="$INPUT" python3 - <<'PYEOF'
import json, os, re, sys

try:
    payload = json.loads(os.environ.get("SECRET_GUARD_INPUT") or "{}")
except Exception:
    sys.exit(0)

cmd = (payload.get("tool_input") or {}).get("command") or ""
if not cmd:
    sys.exit(0)

if re.search(r'(^|[;|&]\s*)\s*(jq|yq)\b', cmd):
    cmd = re.sub(r"'([.(\[{][^']*)'",
                 lambda m: "''" if re.search(r"[\s|(\[{,?]|//", m.group(1)) else m.group(0),
                 cmd)

PATTERNS = [
    (r'(^|[\s"\'`=@:/])\.env(\.[\w.-]+)?($|[\s"\'`);|&<>])', "файл .env*"),
    (r'(^|[\s"\'`=@:])(\./)?secrets/', "каталог secrets/"),
    (r'(~|\$HOME|/Users/[^/\s]+|/home/[^/\s]+)/\.(ssh|aws|gnupg|kube)($|[/\s"\'`;|&)])',
     "~/.ssh, ~/.aws, ~/.gnupg, ~/.kube"),
    (r'\bid_(rsa|ed25519|ecdsa|dsa)\b', "приватный SSH-ключ"),
    (r'\.(pem|p12|pfx)($|[\s"\'`;|&)])', "ключ/сертификат (*.pem/*.p12/*.pfx)"),
    (r'\.key($|[\s"\'`;|&)])', "ключ (*.key)"),
    (r'\.credentials\.json', ".credentials.json"),
]

for pattern, label in PATTERNS:
    if re.search(pattern, cmd):
        sys.stderr.write(
            "SECRET-GUARD: команда ссылается на секретный путь (%s) — заблокировано.\n"
            "Ложное срабатывание — пользователь выполняет команду сам (! prefix) "
            "или правит hooks/secret-read-guard.sh.\n"
            "Команда: %s\n" % (label, cmd)
        )
        sys.exit(2)

sys.exit(0)
PYEOF
