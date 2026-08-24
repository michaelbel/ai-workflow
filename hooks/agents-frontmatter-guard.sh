#!/bin/bash
# name: agents-frontmatter-guard
# description: После правки agents/*.md проверяет допустимость model:, отсутствие effort: у haiku и существование скиллов из skills:.
# type: PostToolUse
# matcher: Edit|Write

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    echo "WARN: python3 not found — agents-frontmatter-guard cannot parse tool input, skipping check" >&2
    exit 0
fi

AGENTS_GUARD_INPUT="$INPUT" python3 - <<'PYEOF'
import json, os, re, sys

try:
    payload = json.loads(os.environ.get("AGENTS_GUARD_INPUT") or "{}")
except Exception:
    sys.exit(0)

file_path = (payload.get("tool_input") or {}).get("file_path") or ""
if not re.search(r'(^|/)(\.claude/)?agents/[^/]+\.md$', file_path):
    sys.exit(0)

try:
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
except OSError:
    sys.exit(0)

m = re.match(r'^---\n(.*?\n)---\n', text, re.S)
if not m:
    sys.exit(0)

fields = {}
current = None
for line in m.group(1).split("\n"):
    key_match = re.match(r'^([A-Za-z_][\w]*):\s?(.*)$', line)
    if key_match:
        current = key_match.group(1)
        fields[current] = key_match.group(2).strip()
    elif current is not None and line.strip():
        fields[current] = (fields[current] + " " + line.strip()).strip()

problems = []

ALLOWED_MODELS = {"sonnet", "opus", "haiku", "fable", ""}
model = fields.get("model", "").strip().strip('"')
if model not in ALLOWED_MODELS:
    problems.append("model: '%s' не входит в допустимый набор (sonnet/opus/haiku/fable)" % model)

effort = fields.get("effort", "").strip()
if model == "haiku" and effort:
    problems.append("model: haiku не сочетается с effort: '%s' — у haiku нет effort" % effort)

skills_raw = fields.get("skills", "").strip().lstrip(">-").strip()
if skills_raw:
    project_root = payload.get("cwd") or "."
    skills_dirs = [
        os.path.join(project_root, "skills"),
        os.path.join(project_root, ".claude", "skills"),
    ]
    existing_dir = next((d for d in skills_dirs if os.path.isdir(d)), None)
    if existing_dir:
        known = {n for n in os.listdir(existing_dir) if os.path.isdir(os.path.join(existing_dir, n))}
        for name in [s.strip() for s in skills_raw.split(",") if s.strip()]:
            if ":" in name:
                continue
            if name not in known:
                problems.append("skills: '%s' не найден в %s" % (name, existing_dir))

if problems:
    sys.stderr.write(
        "AGENTS-FRONTMATTER-GUARD: %s — %s\n" % (file_path, "; ".join(problems))
    )
    sys.exit(2)

sys.exit(0)
PYEOF
