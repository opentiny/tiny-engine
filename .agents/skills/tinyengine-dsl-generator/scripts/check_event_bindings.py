#!/usr/bin/env python3
"""
TinyEngine Event Binding Checker

检查DSL文件中的事件绑定是否正确使用JSExpression引用方法，
而不是在value中直接写函数定义。
"""

import json
import sys
from typing import Dict, List, Any


class EventBindingChecker:
    """事件绑定检查器"""

    def __init__(self, dsl_data: Dict[str, Any]):
        self.dsl = dsl_data
        self.errors = []
        self.warnings = []

    def check(self) -> bool:
        """检查所有事件绑定"""
        # 从page_content或直接检查
        page_content = self.dsl.get('page_content', self.dsl)

        self._check_node(page_content)
        return len(self.errors) == 0

    def _check_node(self, node: Any) -> None:
        """递归检查节点"""
        if isinstance(node, dict):
            # 检查当前节点的事件绑定
            self._check_event_bindings(node)

            # 递归检查子节点
            if 'children' in node:
                for child in node['children']:
                    self._check_node(child)

        elif isinstance(node, list):
            for item in node:
                self._check_node(item)

    def _check_event_bindings(self, node: Dict[str, Any]) -> None:
        """检查单个节点的事件绑定（含 props 内的事件绑定）"""
        component = node.get('componentName', 'unknown')

        # 两处都需要校验，避免漏检 props 内的事件。
        self._check_event_holder(node, component)
        props = node.get('props')
        if isinstance(props, dict):
            self._check_event_holder(props, component)

    def _check_event_holder(self, holder: Dict[str, Any], component: str) -> None:
        """检查某个属性容器（节点本身或其 props）内的事件绑定"""
        # 检查所有可能的事件属性
        event_keys = [
            'onClick', 'onChange', 'onKeyup', 'onKeyDown', 'onKeyPress',
            'onFocus', 'onBlur', 'onSubmit', 'onInput', 'onTabClick',
            'onCurrentChange', 'onSizeChange', 'onCheckChange',
            'onNodeClick', 'onRowClick', 'onCellClick'
        ]

        for key in event_keys:
            if key in holder:
                value = holder[key]
                if isinstance(value, dict):
                    self._check_event_value(component, key, value)

        # 也检查以'on'开头的属性
        for key, value in holder.items():
            if key.startswith('on') and key not in event_keys:
                if isinstance(value, dict):
                    self._check_event_value(component, key, value)

    def _check_event_value(self, component: str, event_key: str, value: Dict[str, Any]) -> None:
        """检查事件值"""
        value_type = value.get('type')
        value_content = value.get('value', '')

        # 错误1: 使用JSFunction类型进行事件绑定
        if value_type == 'JSFunction':
            self.errors.append(
                f"{component}.{event_key}: 使用了JSFunction类型，应该使用JSExpression引用methods中的方法"
            )

        # 错误2: JSExpression的value中包含函数定义
        if value_type == 'JSExpression' and value_content.startswith('function'):
            self.errors.append(
                f"{component}.{event_key}: JSExpression的value中包含函数定义 '{value_content[:30]}...'，"
                f"应该引用方法如 'this.methodName'"
            )

    def report(self) -> str:
        """生成报告"""
        lines = []
        if self.errors:
            lines.append("❌ 发现事件绑定错误:")
            for error in self.errors:
                lines.append(f"  - {error}")
        if self.warnings:
            lines.append("⚠️  警告:")
            for warning in self.warnings:
                lines.append(f"  - {warning}")
        if not self.errors and not self.warnings:
            lines.append("✅ 所有事件绑定检查通过!")
        return "\n".join(lines)


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("Usage: check_event_bindings.py <dsl-file>")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            dsl_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    checker = EventBindingChecker(dsl_data)
    is_valid = checker.check()
    print(checker.report())
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
