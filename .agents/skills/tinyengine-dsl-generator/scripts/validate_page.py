#!/usr/bin/env python3
"""
TinyEngine Page DSL 综合验证

验证包装格式的页面DSL文件（包含 name, id, app, route, page_content 等字段）。
运行所有检查：结构验证、事件绑定检查、CSS检查。
"""

import json
import subprocess
import sys
from pathlib import Path


def validate_page_wrapper(file_path: str) -> bool:
    """验证包装格式的页面文件"""
    print(f"验证文件: {file_path}")
    print("=" * 50)

    # 读取文件
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return False

    # 检查是否是包装格式
    if 'page_content' not in data:
        print("❌ 不是有效的页面文件（缺少 page_content 字段）")
        return False

    page_content = data.get('page_content', {})

    # 检查必要字段
    required_fields = ['name', 'id', 'app', 'route']
    for field in required_fields:
        if field not in data:
            print(f"❌ 缺少必要字段: {field}")
            return False

    # 验证 app 字段格式 (建议使用整数)
    if 'app' in data:
        app_field = data['app']
        if not isinstance(app_field, int):
            print(f"⚠️  WARNING: 'app' field should be integer, got: {type(app_field).__name__} (will be coerced)")

    # 检查 page_content 中的必要字段
    if 'componentName' not in page_content:
        print("❌ page_content 缺少 componentName 字段")
        return False

    if page_content['componentName'] != 'Page':
        print(f"❌ componentName 必须是 'Page'，实际是: {page_content['componentName']}")
        return False

    if 'fileName' not in page_content:
        print("❌ page_content 缺少 fileName 字段")
        return False

    print("✅ 包装格式检查通过")
    return True


def run_checkers(file_path: str) -> bool:
    """运行所有检查器"""
    script_dir = Path(__file__).parent

    # 1. 事件绑定检查
    print("\n1️⃣ 事件绑定检查...")
    result = subprocess.run(
        [sys.executable, str(script_dir / 'check_event_bindings.py'), file_path],
        capture_output=False
    )
    if result.returncode != 0:
        return False

    # 2. CSS 检查
    print("\n2️⃣ CSS 语法检查...")
    result = subprocess.run(
        [sys.executable, str(script_dir / 'check_css.py'), file_path, 'basic'],
        capture_output=False
    )
    if result.returncode != 0:
        return False

    return True


def check_class_name_usage(file_path: str) -> bool:
    """检查是否正确使用 className 而不是 class"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except:
        return True  # JSON 错误会在其他检查中捕获

    page_content = data.get('page_content', {})
    errors = []

    def check_node(node, path='root'):
        if isinstance(node, dict):
            # 检查 props 中是否有 'class'
            if 'props' in node and isinstance(node['props'], dict):
                if 'class' in node['props']:
                    component = node.get('componentName', 'unknown')
                    errors.append(f"{component} 使用了 'class' 而不是 'className'")

            # 递归检查 children
            if 'children' in node:
                for i, child in enumerate(node['children']):
                    check_node(child, f"{path}/children/{i}")
        elif isinstance(node, list):
            for i, item in enumerate(node):
                check_node(item, f"{path}[{i}]")

    check_node(page_content)

    if errors:
        print("\n❌ 发现错误的 'class' 使用（应该使用 'className'）:")
        for error in errors:
            print(f"  - {error}")
        return False

    print("\n✅ className 检查通过")
    return True


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("Usage: validate_page.py <page-file>")
        print("验证包装格式的TinyEngine页面DSL文件")
        sys.exit(1)

    file_path = sys.argv[1]

    # 运行所有检查
    all_passed = True

    # 1. 包装格式检查
    if not validate_page_wrapper(file_path):
        all_passed = False

    # 2. className 检查
    if not check_class_name_usage(file_path):
        all_passed = False

    # 3. 运行其他检查器
    if not run_checkers(file_path):
        all_passed = False

    # 总结
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ 所有验证通过!")
    else:
        print("❌ 验证失败，请修复错误后重试")

    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
