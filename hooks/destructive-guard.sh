#!/bin/bash
# name: destructive-guard
# description: Блокирует катастрофические Bash-команды (rm -rf по системным путям, dd/mkfs/shred по устройствам, fork bomb, curl|sh, git push --force без lease).
# type: PreToolUse
# matcher: Bash

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — destructive-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

DESTRUCTIVE_GUARD_INPUT="$INPUT" python3 - <<'PYEOF'
import json, os, re, shlex, sys

try:
    payload = json.loads(os.environ.get("DESTRUCTIVE_GUARD_INPUT") or "{}")
except Exception:
    sys.exit(0)

cmd = (payload.get("tool_input") or {}).get("command") or ""
if not cmd:
    sys.exit(0)

def deny(label):
    sys.stderr.write(
        "DESTRUCTIVE-GUARD: команда попадает под катастрофический паттерн (%s) — заблокировано.\n"
        "Найди безопасную альтернативу или объясни пользователю, чтобы он выполнил команду "
        "сам (! prefix).\n"
        "Команда: %s\n" % (label, cmd)
    )
    sys.exit(2)

REGEX_PATTERNS = [
    (r'\bdd\b[^|;&]*\bof=/dev/(?:sd|hd|nvme|disk|vd|xvd|mmcblk|loop|md|dm-)', "dd поверх блочного устройства"),
    (r'\bmkfs(\.\w+)?\s', "форматирование файловой системы"),
    (r'\bshred\b[^|;&]*/dev/', "shred по устройству"),
    (r'\bchmod\s+-[a-zA-Z]*R[a-zA-Z]*\s+\S+\s+/(?:\s|$)', "рекурсивный chmod по корню"),
    (r':\(\)\s*\{\s*:\|:', "fork bomb"),
    (r'\b(?:curl|wget)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b', "pipe скачанного кода в shell"),
]
for pattern, label in REGEX_PATTERNS:
    if re.search(pattern, cmd):
        deny(label)

SEGMENTS = re.split(r'&&|\|\||[|;&]', cmd)

CRITICAL_EXACT = {
    "/", "/*",
    "~", "~/", "~/*",
    "$HOME", "$HOME/", "$HOME/*", "${HOME}", "${HOME}/", "${HOME}/*",
    ".", "..", "./", "../", "../*",
}
SYSTEM_PREFIXES = (
    "/bin", "/sbin", "/usr", "/etc", "/var", "/opt", "/boot", "/lib", "/lib64",
    "/srv", "/root", "/System", "/Library", "/Applications", "/Volumes", "/private",
)

def is_critical_target(t):
    if t in CRITICAL_EXACT:
        return True
    if t.startswith(SYSTEM_PREFIXES):
        rest = t[len(next(p for p in SYSTEM_PREFIXES if t.startswith(p))):]
        if rest == "" or rest.startswith("/") or rest == "*":
            return True
    m = re.match(r'^/(?:home|Users)(?:/[^/]+)?/?$', t)
    return bool(m)

def tokens(segment):
    try:
        return shlex.split(segment)
    except ValueError:
        return segment.split()

for seg in SEGMENTS:
    toks = tokens(seg)
    if not toks:
        continue

    rm_positions = [i for i, t in enumerate(toks) if t == "rm" or t.endswith("/rm")]
    for i in rm_positions:
        rest = toks[i + 1:]
        flags = [t for t in rest if t.startswith("-")]
        targets = [t for t in rest if not t.startswith("-")]
        recursive = any(
            t == "--recursive" or re.match(r'^-[a-zA-Z]*[rR]', t) for t in flags
        )
        if recursive and any(is_critical_target(t) for t in targets):
            deny("рекурсивное rm по корню/системному пути/домашней директории")

    if "git" in toks and "push" in toks:
        force = any(t in ("--force", "-f") for t in toks)
        lease = any(t.startswith("--force-with-lease") or t == "--force-if-includes" for t in toks)
        if force and not lease:
            deny("git push --force без --force-with-lease/--force-if-includes")

sys.exit(0)
PYEOF
