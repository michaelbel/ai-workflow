#!/bin/bash
# Typecheck-on-edit: PostToolUse на Edit|Write, гоняет tsc --noEmit сразу после правки
# файла в mcp/src или mcp/scripts — короче цикл обратной связи, чем ждать npm run check.
#
# mcp/ не использует форматтер/линтер (только tsc), поэтому единственная быстрая
# автоматическая проверка здесь — типы. Fail-open, если зависимости не установлены
# (нет mcp/node_modules) или файл не относится к mcp/{src,scripts}.

INPUT=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
    exit 0
fi

FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if ! echo "$FILE_PATH" | grep -qE 'mcp/(src|scripts)/.*\.ts$'; then
    exit 0
fi

if [ ! -d "mcp/node_modules" ]; then
    exit 0
fi

OUTPUT=$(cd mcp && npx tsc --noEmit 2>&1)
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "TYPECHECK-ON-EDIT: tsc --noEmit провалился после правки $FILE_PATH" >&2
    echo "$OUTPUT" >&2
    exit 2
fi

exit 0
