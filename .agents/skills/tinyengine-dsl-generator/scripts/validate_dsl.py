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
        self.original = dsl_data
        # 落盘文件是"外层包装 + 内层 DSL"，这里解包到内层 DSL 再做协议校验。
        self.dsl, self._from_wrapper = self._unwrap(dsl_data)
        self.schema_type = schema_type
        self.errors = []
        self.warnings = []

        # 自动检测schema类型
        if schema_type == 'auto':
            self.schema_type = self._detect_schema_type()

    @staticmethod
    def _unwrap(dsl_data: Any):
        """
        识别并解包外层包装结构。

        TinyEngine 落盘的页面/区块文件是"外层包装 + 内层 DSL"结构：
        - 页面：真正的页面 DSL 在 `page_content` 内
        - 区块：真正的区块 DSL 在 `content` 内
        返回 (内层DSL, 是否来自包装)。若不是包装结构，原样返回 (原数据, False)。
        仅当内层确实是含 componentName 的节点时才解包，避免误吞同名普通字段。
        """
        if isinstance(dsl_data, dict):
            for key in ('page_content', 'content'):
                inner = dsl_data.get(key)
                if isinstance(inner, dict) and 'componentName' in inner:
                    return inner, True
        return dsl_data, False

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
        required = ['componentName', 'fileName']
        for field in required:
            if field not in self.dsl:
                self.errors.append(f"Missing required field: {field}")

        if self.dsl.get('componentName') != 'Page':
            self.errors.append(f"Page componentName must be 'Page', got: {self.dsl.get('componentName')}")

        # 验证meta
        # 原始页面协议(IPageSchema)要求 meta；但外层包装格式把 meta 等元信息
        # 上提到包装层(name/route/isHome/parentId/group...)，page_content 内不再含 meta。
        # 因此仅在校验"裸"页面 DSL 时强制要求 meta；包装格式由外层字段承载。
        if 'meta' in self.dsl:
            self._validate_meta(self.dsl['meta'])
        elif not self._from_wrapper:
            self.errors.append("Missing required field: meta")

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
        # children 可以是字符串（文本子节点），按协议(IComponentSchema[] | string)
        # 这是合法形态，无需逐项校验；递归调用遇到字符串时同样直接返回。
        if isinstance(children, str):
            return
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
