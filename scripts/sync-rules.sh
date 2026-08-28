#!/usr/bin/env bash
# sync-rules.sh — генерирует адаптеры правил для инструментов без нативного формата правил
# из единственного источника правды `rules/`.
#
# Производит:
#   .cursor/rules/<rule>.mdc   правила Cursor (file-triggered по globs или alwaysApply)
#   .windsurfrules             плоский файл правил Windsurf (процессные правила + ссылка на MCP)
#
# Соответствие:
#   - правило с `paths:` во frontmatter  → продуктовое (Kotlin/Compose/KMP/Android):
#       globs = список paths через запятую, alwaysApply: false
#   - правило без `paths:`                → процессное (git, github-*, filesystem, workflow):
#       globs отсутствует, alwaysApply: true
#
# Оба выходных набора — СГЕНЕРИРОВАННЫЕ артефакты, вручную их не редактируют.
# Источник правды — `rules/` и `AGENTS.md`. После правки правила перегенерируй:
#   bash scripts/sync-rules.sh
#
# Использование:
#   bash scripts/sync-rules.sh          # перегенерировать всё
#   bash scripts/sync-rules.sh --dry    # только показать, ничего не писать

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES_DIR="$REPO_ROOT/rules"
CURSOR_DIR="$REPO_ROOT/.cursor/rules"
WINDSURFRULES="$REPO_ROOT/.windsurfrules"
DRY_RUN=false
[[ "${1:-}" == "--dry" ]] && DRY_RUN=true

write_file() {
    local path="$1" content="$2"
    if $DRY_RUN; then
        echo "── $path ─────────────────────────────"
        printf '%s\n' "$content" | head -20
        echo "..."
    else
        mkdir -p "$(dirname "$path")"
        printf '%s\n' "$content" > "$path"
        echo "  wrote ${path#"$REPO_ROOT"/}"
    fi
}

# frontmatter-поля правила: печатает `paths` как список через запятую (пусто, если нет блока paths)
rule_globs() {
    awk '
        BEGIN { infm = 0; inpaths = 0 }
        NR == 1 && $0 == "---" { infm = 1; next }
        infm && $0 == "---" { exit }
        infm && /^paths:/ { inpaths = 1; next }
        infm && inpaths && /^[[:space:]]*-[[:space:]]*/ {
            line = $0
            sub(/^[[:space:]]*-[[:space:]]*/, "", line)
            gsub(/"/, "", line)
            out = (out == "" ? line : out "," line)
            next
        }
        infm && inpaths && /^[^[:space:]-]/ { inpaths = 0 }
        END { print out }
    ' "$1"
}

# тело правила без YAML-frontmatter (правила без frontmatter печатаются целиком)
rule_body() {
    awk '
        NR == 1 && $0 != "---" { plain = 1 }
        plain { print; next }
        /^---$/ { fm++; next }
        fm >= 2 { print }
    ' "$1"
}

# значение поля `description:` из frontmatter правила; поддерживает как одну строку
# (`description: текст` / `description: "текст"`), так и folded-скаляр
# (`description: >-` с продолжением на строках с отступом в 2 пробела).
rule_description() {
    awk '
        BEGIN { infm = 0; grab = 0 }
        NR == 1 && $0 == "---" { infm = 1; next }
        infm && $0 == "---" { exit }
        infm && /^description:[[:space:]]*[>|]-?[[:space:]]*$/ { grab = 1; next }
        infm && grab && /^  / {
            line = $0
            sub(/^  /, "", line)
            out = (out == "" ? line : out " " line)
            next
        }
        infm && grab && /^[^ ]/ { grab = 0 }
        infm && !grab && /^description:[[:space:]]/ {
            line = $0
            sub(/^description:[[:space:]]*/, "", line)
            if (line ~ /^".*"$/) {
                line = substr(line, 2, length(line) - 2)
                gsub(/\\"/, "\"", line)
            }
            out = line
        }
        END { print out }
    ' "$1"
}

echo "Генерация .cursor/rules/ из rules/ ..."
PROCESS_RULES=()
for rule_file in "$RULES_DIR"/*.md; do
    name="$(basename "$rule_file" .md)"
    globs="$(rule_globs "$rule_file")"
    desc="$(rule_description "$rule_file")"
    [[ -z "$desc" ]] && desc="Правило $name"
    body="$(rule_body "$rule_file")"

    fm="---"$'\n'"description: ${desc} (cuckcoder)"
    if [[ -n "$globs" ]]; then
        fm+=$'\n'"globs: ${globs}"$'\n'"alwaysApply: false"
    else
        fm+=$'\n'"alwaysApply: true"
        PROCESS_RULES+=("$name")
    fi
    fm+=$'\n'"---"

    write_file "$CURSOR_DIR/${name}.mdc" "${fm}"$'\n\n'"${body}"
done

# базовое всегда-активное правило из личных инструкций AGENTS.md
standards_body="$(awk '/^## Личные инструкции/ { found = 1 } found { print } /^## Kotlin, Compose, KMP, Android rules/ { exit }' "$REPO_ROOT/AGENTS.md" | sed '${/^## Kotlin/d;}')"
base_rule="---
description: Cuckcoder — базовые правила проекта, активны всегда
alwaysApply: true
---

${standards_body}
Полный набор продуктовых правил Kotlin/Compose/KMP/Android — через MCP-инструменты cuckcoder
\`list\`/\`get_rule\` либо файлы \`.cursor/rules/*.mdc\`, сгенерированные из \`rules/\`."
write_file "$CURSOR_DIR/000-cuckcoder-base.mdc" "$base_rule"

echo "Генерация $WINDSURFRULES ..."
ws_header="# Cuckcoder — правила проекта
# СГЕНЕРИРОВАНО scripts/sync-rules.sh — вручную не редактировать.
# Источник правды: rules/ и AGENTS.md. Продуктовые правила Kotlin/Compose/KMP/Android
# доступны в этом клиенте только через MCP-инструменты cuckcoder list/get_rule/get_skill.
"
ws_body=""
for name in "${PROCESS_RULES[@]}"; do
    ws_body+=$'\n\n---\n\n'"$(rule_body "$RULES_DIR/${name}.md")"
done
write_file "$WINDSURFRULES" "${ws_header}${ws_body}"

echo ""
echo "Готово."
echo "  .cursor/rules/  ($(ls -1 "$RULES_DIR"/*.md | wc -l | tr -d ' ') правил + 1 базовое)"
echo "  .windsurfrules  (${#PROCESS_RULES[@]} процессных правила)"
$DRY_RUN && echo "  (dry-run — ничего не записано)"
