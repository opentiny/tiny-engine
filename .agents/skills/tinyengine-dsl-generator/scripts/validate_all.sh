#!/bin/bash
# TinyEngine DSL 综合验证脚本
# 运行所有检查：结构验证、事件绑定检查、CSS检查

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSL_FILE="$1"

if [ -z "$DSL_FILE" ]; then
    echo "Usage: validate_all.sh <dsl-file>"
    exit 1
fi

if [ ! -f "$DSL_FILE" ]; then
    echo "❌ File not found: $DSL_FILE"
    exit 1
fi

echo "======================================"
echo "TinyEngine DSL 综合验证"
echo "文件: $DSL_FILE"
echo "======================================"
echo

# 1. 结构验证
echo "1️⃣ 结构验证..."
node "$SCRIPT_DIR/validate_dsl.mjs" "$DSL_FILE" || exit 1
echo

# 2. 事件绑定检查
echo "2️⃣ 事件绑定检查..."
node "$SCRIPT_DIR/check_event_bindings.mjs" "$DSL_FILE" || exit 1
echo

# 3. CSS 语法检查
echo "3️⃣ CSS 语法检查..."
node "$SCRIPT_DIR/check_css.mjs" "$DSL_FILE" basic || exit 1
echo

echo "======================================"
echo "✅ 所有验证通过!"
echo "======================================"
