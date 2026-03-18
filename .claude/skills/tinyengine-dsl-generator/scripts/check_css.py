#!/usr/bin/env python3
"""
TinyEngine CSS Syntax Checker

检查DSL中的CSS字段是否有语法错误。

支持三种模式：
1. basic: 基础语法检查（默认，无需额外依赖）
2. tinycss2: 使用 tinycss2 库（需要安装：pip install tinycss2）
3. postcss: 使用 postcss 命令行工具（需要安装：npm install -g postcss）

用法：
  python3 check_css.py <dsl-file> [mode]
  python3 check_css.py <dsl-file> postcss  # 使用postcss检查
  python3 check_css.py <dsl-file> tinycss2 # 使用tinycss2检查
"""

import json
import re
import subprocess
import sys
from typing import Dict, List, Any


class CSSChecker:
    """CSS语法检查器基类"""

    def __init__(self, dsl_data: Dict[str, Any]):
        self.dsl = dsl_data
        self.errors = []
        self.warnings = []

    def check(self) -> bool:
        """检查CSS语法"""
        page_content = self.dsl.get('page_content', self.dsl)
        css_string = page_content.get('css', '')

        if not css_string:
            self.warnings.append("No CSS field found")
            return True

        return self._check_css(css_string)

    def _check_css(self, css: str) -> bool:
        """子类实现具体的检查逻辑"""
        raise NotImplementedError

    def report(self) -> str:
        """生成报告"""
        lines = []
        if self.errors:
            lines.append("❌ CSS Errors:")
            for error in self.errors:
                lines.append(f"  - {error}")
        if self.warnings:
            lines.append("⚠️ CSS Warnings:")
            for warning in self.warnings:
                lines.append(f"  - {warning}")
        if not self.errors and not self.warnings:
            lines.append("✅ CSS check passed!")
        return "\n".join(lines)


class BasicCSSChecker(CSSChecker):
    """基础CSS语法检查器（无需额外依赖）"""

    def _check_css(self, css: str) -> bool:
        """基础检查：括号匹配、基本语法"""
        # 检查括号匹配
        stack = []
        i = 0
        while i < len(css):
            char = css[i]
            if char in '{':
                stack.append((char, i))
            elif char in '}':
                if not stack or stack[-1][0] != '{':
                    self.errors.append(f"Unmatched '}}' at position {i}")
                    return False
                stack.pop()
            elif char in '(':
                stack.append((char, i))
            elif char in ')':
                if not stack or stack[-1][0] != '(':
                    self.errors.append(f"Unmatched ')' at position {i}")
                    return False
                stack.pop()
            i += 1

        if stack:
            for char, pos in stack:
                self.errors.append(f"Unclosed '{char}' at position {pos}")
            return False

        # 移除注释进行检查
        css_no_comments = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)

        # 检查是否有CSS规则
        if '{' not in css_no_comments:
            self.warnings.append("CSS may not contain any rules")

        # 检查分号使用
        rules = re.findall(r'\{([^}]*)\}', css_no_comments)
        for rule in rules:
            properties = rule.split(';')
            for prop in properties[:-1]:  # 最后一个可能为空
                prop = prop.strip()
                if prop and ':' not in prop:
                    self.warnings.append(f"Property without colon: {prop[:50]}")

        return len(self.errors) == 0


class TinyCSS2Checker(CSSChecker):
    """使用tinycss2库的CSS检查器"""

    def _check_css(self, css: str) -> bool:
        try:
            import tinycss2
        except ImportError:
            self.errors.append(
                "tinycss2 not installed. Install with: pip install tinycss2"
            )
            return False

        # 使用tinycss2解析CSS
        try:
            # 解析CSS规则列表
            rules = tinycss2.parse_stylesheet(css, skip_comments=False)

            # tinycss2会抛出解析错误
            for rule in rules:
                if rule.type == 'error':
                    self.errors.append(f"Parse error: {rule.message}")

            return len(self.errors) == 0

        except Exception as e:
            self.errors.append(f"Failed to parse CSS: {e}")
            return False


class PostCSSChecker(CSSChecker):
    """使用postcss命令行工具的CSS检查器"""

    def _check_css(self, css: str) -> bool:
        # 检查postcss是否可用
        try:
            result = subprocess.run(
                ['postcss', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                self.errors.append("postcss command failed. Install with: npm install -g postcss")
                return False
        except FileNotFoundError:
            self.errors.append("postcss not found. Install with: npm install -g postcss")
            return False
        except subprocess.TimeoutExpired:
            self.errors.append("postcss command timed out")
            return False

        # 将CSS写入临时文件
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.css', delete=False) as f:
            f.write(css)
            temp_file = f.name

        try:
            # 使用postcss解析CSS
            result = subprocess.run(
                ['postcss', temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )

            # postcss的错误输出
            if result.stderr:
                # 过滤掉警告（如<css input>:3:3: Yellow color）
                errors = []
                warnings = []
                for line in result.stderr.strip().split('\n'):
                    if line:
                        if any(w in line.lower() for w in ['warning', 'yellow']):
                            warnings.append(line)
                        else:
                            errors.append(line)

                self.errors.extend(errors)
                self.warnings.extend(warnings)

            return len(self.errors) == 0

        except subprocess.TimeoutExpired:
            self.errors.append("postcss command timed out")
            return False
        finally:
            import os
            try:
                os.unlink(temp_file)
            except:
                pass


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("Usage: check_css.py <dsl-file> [mode]")
        print("  mode: basic (default), tinycss2, postcss")
        sys.exit(1)

    file_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'basic'

    # 读取DSL文件
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            dsl_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    # 选择检查器
    checkers = {
        'basic': BasicCSSChecker,
        'tinycss2': TinyCSS2Checker,
        'postcss': PostCSSChecker
    }

    checker_class = checkers.get(mode)
    if not checker_class:
        print(f"❌ Unknown mode: {mode}")
        print(f"Available modes: {', '.join(checkers.keys())}")
        sys.exit(1)

    checker = checker_class(dsl_data)
    is_valid = checker.check()
    print(checker.report())
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
