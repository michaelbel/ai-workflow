#!/bin/bash
# Secret-read guard: PreToolUse на Bash, блокирует команды, ссылающиеся на секретные пути.
#
# Зачем: deny-правила Read(./.env, ~/.ssh/**, …) в settings.json закрывают только
# инструмент Read, а разрешённые Bash-ридеры (cat/head/tail/grep/sed/curl --data @…)
# читают и передают наружу те же файлы в обход. Guard зеркалит тот же список путей
# на уровне Bash-команд, так что секреты не попадают ни в контекст модели, ни в сеть.
#
# Fail-open по инфраструктуре (нет python3 — пропустить), fail-closed по совпадению.
# Ложное срабатывание (например, docker compose --env-file .env up) — пользователь
# выполняет команду сам (! prefix) или правит PATTERNS ниже.

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — secret-read-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

# Payload через env: heredoc занимает stdin python3 под сам скрипт.
SECRET_GUARD_INPUT="$INPUT" python3 - <<'PYEOF'
import json, os, re, sys

try:
    payload = json.loads(os.environ.get("SECRET_GUARD_INPUT") or "{}")
except Exception:
    sys.exit(0)

cmd = (payload.get("tool_input") or {}).get("command") or ""
if not cmd:
    sys.exit(0)

# jq/yq: путь к ключу `.env.FOO` внутри программы неотличим по тексту от имени файла,
# поэтому такой аргумент программы исключается из проверки. Программой считается
# одинарно-кавыченный аргумент, начинающийся как выражение (., (, [, {) и содержащий
# метасимвол jq — то есть jq '.env.FOO' f.json (без метасимволов) остаётся заблокирован.
if re.search(r'(^|[;|&]\s*)\s*(jq|yq)\b', cmd):
    cmd = re.sub(r"'([.(\[{][^']*)'",
                 lambda m: "''" if re.search(r"[\s|(\[{,?]|//", m.group(1)) else m.group(0),
                 cmd)

# (regex, что зацепило) — зеркало deny-списка Read из settings.json.
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
