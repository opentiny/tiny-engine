#!/usr/bin/env python3
"""
TinyEngine DSL Validator

验证生成的DSL是否符合TinyEngine协议规范。
"""

import json
import sys
from typing import Any, Dict, List, Optional


class TinyEngineValidator:
    """TinyEngine DSL验证器"""

    # 保留组件名
    RESERVED_COMPONENT_NAMES = {'Page', 'Block', 'Component', 'Template', 'Slot', 'Collection', 'Text'}

    def __init__(self, dsl_data: Dict[str, Any], schema_type: str = 'auto'):
        """
        初始化验证器

        Args:
            dsl_data: DSL数据
            schema_type: Schema类型 ('page', 'block', 'app', 'auto')
        """
        self.dsl = dsl_data
        self.schema_type = schema_type
        self.errors = []
        self.warnings = []

        # 自动检测schema类型
        if schema_type == 'auto':
            self.schema_type = self._detect_schema_type()

    def _detect_schema_type(self) -> str:
        """自动检测schema类型"""
        if 'componentName' in self.dsl:
            cn = self.dsl['componentName']
            if cn == 'Page':
                return 'page'
            elif cn == 'Block':
                return 'block'
        elif 'componentsTree' in self.dsl or 'version' in self.dsl:
            return 'app'
        return 'unknown'

    def validate(self) -> bool:
        """验证DSL，返回是否有效"""
        if self.schema_type == 'page':
            return self._validate_page()
        elif self.schema_type == 'block':
            return self._validate_block()
        elif self.schema_type == 'app':
            return self._validate_app()
        else:
            self.errors.append(f"Unknown schema type: {self.schema_type}")
            return False

    def _validate_page(self) -> bool:
        """验证页面Schema"""
        required = ['componentName', 'fileName', 'meta']
        for field in required:
            if field not in self.dsl:
                self.errors.append(f"Missing required field: {field}")

        if self.dsl.get('componentName') != 'Page':
            self.errors.append(f"Page componentName must be 'Page', got: {self.dsl.get('componentName')}")

        # 验证meta
        if 'meta' in self.dsl:
            self._validate_meta(self.dsl['meta'])

        # 验证children
        if 'children' in self.dsl and self.dsl['children']:
            self._validate_children(self.dsl['children'])

        return len(self.errors) == 0

    def _validate_block(self) -> bool:
        """验证区块Schema"""
        required = ['componentName', 'fileName']
        for field in required:
            if field not in self.dsl:
                self.errors.append(f"Missing required field: {field}")

        if self.dsl.get('componentName') != 'Block':
            self.errors.append(f"Block componentName must be 'Block', got: {self.dsl.get('componentName')}")

        # 验证schema（对外暴露的配置）
        if 'schema' in self.dsl:
            self._validate_block_schema(self.dsl['schema'])

        # 验证children
        if 'children' in self.dsl and self.dsl['children']:
            self._validate_children(self.dsl['children'])

        return len(self.errors) == 0

    def _validate_app(self) -> bool:
        """验证应用Schema"""
        required = ['version', 'componentsMap', 'componentsTree']
        for field in required:
            if field not in self.dsl:
                self.errors.append(f"Missing required field: {field}")

        # 验证 app ID 格式
        if 'id' in self.dsl:
            root_id = self.dsl['id']
            if not isinstance(root_id, int):
                self.warnings.append(f"App Schema 'id' should be integer, got: {type(root_id).__name__} (will be coerced)")

        # 验证 meta.appId 格式
        if 'meta' in self.dsl and 'appId' in self.dsl['meta']:
            app_id = self.dsl['meta']['appId']
            if not isinstance(app_id, int):
                self.warnings.append(f"meta.appId should be integer, got: {type(app_id).__name__} (will be coerced)")

        # 验证componentsMap
        if 'componentsMap' in self.dsl:
            self._validate_components_map(self.dsl['componentsMap'])

        # 验证componentsTree
        if 'componentsTree' in self.dsl:
            for page in self.dsl['componentsTree']:
                page_validator = TinyEngineValidator(page, 'auto')
                if not page_validator.validate():
                    self.errors.extend([f"[Page {page.get('fileName', '?')}] {e}" for e in page_validator.errors])

        return len(self.errors) == 0

    def _validate_meta(self, meta: Dict[str, Any]) -> None:
        """验证页面meta信息"""
        required = ['id', 'title', 'router', 'creator', 'isHome', 'parentId', 'rootElement']
        for field in required:
            if field not in meta:
                self.errors.append(f"Missing meta field: {field}")

    def _validate_components_map(self, components_map: List[Dict[str, Any]]) -> None:
        """验证组件映射"""
        for comp in components_map:
            required = ['componentName', 'package', 'exportName']
            for field in required:
                if field not in comp:
                    self.errors.append(f"componentsMap missing field: {field}")

    def _validate_block_schema(self, schema: Dict[str, Any]) -> None:
        """验证区块对外暴露的schema"""
        if 'properties' in schema:
            for prop in schema['properties']:
                if 'content' not in prop:
                    self.errors.append("Block schema property missing 'content'")

    def _validate_children(self, children: List[Any]) -> None:
        """验证子组件列表"""
        for i, child in enumerate(children):
            if not isinstance(child, dict):
                self.errors.append(f"Child at index {i} is not an object")
                continue

            if 'componentName' not in child:
                self.errors.append(f"Child at index {i} missing componentName")

            # 检查ID
            if 'id' not in child:
                self.warnings.append(f"Child at index {i} missing id (recommended)")

            # 检查props中是否有错误的'class'字段（应该是'className'）
            if 'props' in child and isinstance(child['props'], dict):
                if 'class' in child['props']:
                    component = child.get('componentName', 'unknown')
                    self.errors.append(
                        f"{component} at index {i} uses 'class' in props, "
                        f"should use 'className' instead (React/Vue convention)"
                    )

            # 验证嵌套children
            if 'children' in child and child['children']:
                self._validate_children(child['children'])

    def report(self) -> str:
        """生成验证报告"""
        lines = []
        if self.errors:
            lines.append("❌ Validation Errors:")
            for error in self.errors:
                lines.append(f"  - {error}")
        if self.warnings:
            lines.append("⚠️ Warnings:")
            for warning in self.warnings:
                lines.append(f"  - {warning}")
        if not self.errors and not self.warnings:
            lines.append("✅ Validation passed!")
        return "\n".join(lines)


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("Usage: validate_dsl.py <dsl-file> [schema-type]")
        print("  schema-type: page, block, app, or auto (default)")
        sys.exit(1)

    file_path = sys.argv[1]
    schema_type = sys.argv[2] if len(sys.argv) > 2 else 'auto'

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            dsl_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    validator = TinyEngineValidator(dsl_data, schema_type)
    is_valid = validator.validate()
    print(validator.report())
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
