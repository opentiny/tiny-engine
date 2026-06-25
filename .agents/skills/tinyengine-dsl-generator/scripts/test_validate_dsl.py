#!/usr/bin/env python3
"""
TinyEngine DSL Validator 回归测试

锁定 validate_dsl.py 对"外层包装 + 内层 DSL"结构（page_content / content）
的识别与递归校验行为，防止文档推荐的一键校验命令对真实页面/区块文件误报失败。

运行：
    python3 test_validate_dsl.py
"""

import os
import sys
import unittest

# 让本脚本能直接 import 同目录下的 validate_dsl 模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_dsl import TinyEngineValidator  # noqa: E402

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
)
PAGES_DIR = os.path.join(REPO_ROOT, 'mockServer', 'data', 'pages')
BLOCKS_DIR = os.path.join(REPO_ROOT, 'mockServer', 'data', 'blocks')


def _page_wrapper():
    """外层包装页面（page_content 内才是真正的页面 DSL）"""
    return {
        "name": "Login",
        "id": "5a3f8e1b9c4d2e7f",
        "app": 1,
        "route": "login",
        "page_content": {
            "componentName": "Page",
            "fileName": "Login",
            "props": {"className": "login-page"},
            "css": ".login-page { padding: 40px; }",
            "state": {},
            "methods": {},
            "lifeCycles": {},
            "children": [],
            "dataSource": {"list": []},
        },
        "isPage": True,
        "group": "staticPages",
        "occupier": None,
        "isHome": False,
    }


def _block_wrapper():
    """外层包装区块（content 内才是真正的区块 DSL）"""
    return {
        "id": "V85zd9sWEya25Kxh",
        "label": "PortalBlock",
        "framework": "Vue",
        "path": "portal",
        "content": {
            "componentName": "Block",
            "fileName": "PortalBlock",
            "props": {},
            "state": {},
            "methods": {},
            "children": [],
            "schema": {"properties": [], "events": {}, "slots": {}},
            "dataSource": {},
        },
        "occupier": None,
        "is_published": True,
    }


def _raw_page_with_meta():
    """原始（裸）页面 DSL，带 meta —— 协议要求的完整形态"""
    return {
        "componentName": "Page",
        "fileName": "HomePage",
        "meta": {
            "id": 1,
            "title": "首页",
            "router": "home",
            "creator": "admin",
            "isHome": True,
            "parentId": "0",
            "rootElement": "div",
        },
        "children": [],
    }


class WrapperDetectionTests(unittest.TestCase):
    """外层包装结构的识别与解包"""

    def test_page_wrapper_detected_as_page_and_valid(self):
        v = TinyEngineValidator(_page_wrapper())
        self.assertEqual(v.schema_type, 'page')
        self.assertTrue(v.validate(), msg=str(v.errors))
        self.assertEqual(v.errors, [])

    def test_block_wrapper_detected_as_block_and_valid(self):
        v = TinyEngineValidator(_block_wrapper())
        self.assertEqual(v.schema_type, 'block')
        self.assertTrue(v.validate(), msg=str(v.errors))
        self.assertEqual(v.errors, [])

    def test_wrapper_does_not_require_meta(self):
        """包装格式把 meta 上提到外层，内层 page_content 不应再强制要求 meta"""
        v = TinyEngineValidator(_page_wrapper())
        v.validate()
        self.assertFalse(any('meta' in e.lower() for e in v.errors),
                         f"不应因缺少 meta 报错: {v.errors}")

    def test_unwrap_tracks_wrapper_flag(self):
        wrapped, flag = TinyEngineValidator._unwrap(_page_wrapper())
        self.assertTrue(flag)
        self.assertEqual(wrapped['componentName'], 'Page')

    def test_non_wrapper_returns_unchanged(self):
        raw = _raw_page_with_meta()
        inner, flag = TinyEngineValidator._unwrap(raw)
        self.assertFalse(flag)
        self.assertIs(inner, raw)


class RawSchemaBackwardCompatTests(unittest.TestCase):
    """原始（裸）DSL 的既有严格行为不应被破坏"""

    def test_raw_page_with_meta_still_passes(self):
        v = TinyEngineValidator(_raw_page_with_meta())
        self.assertEqual(v.schema_type, 'page')
        self.assertTrue(v.validate(), msg=str(v.errors))

    def test_raw_page_without_meta_still_errors(self):
        """裸页面仍必须带 meta（只有包装格式才豁免）"""
        raw = {"componentName": "Page", "fileName": "HomePage", "children": []}
        v = TinyEngineValidator(raw)
        v.validate()
        self.assertTrue(any('meta' in e.lower() for e in v.errors),
                        "裸页面缺少 meta 应报错")

    def test_unknown_schema_still_fails(self):
        v = TinyEngineValidator({"foo": "bar"})
        self.assertEqual(v.schema_type, 'unknown')
        self.assertFalse(v.validate())


class StringChildrenTests(unittest.TestCase):
    """children 为字符串（文本子节点）是协议合法形态，不应误报"""

    def test_string_children_not_flagged(self):
        dsl = {
            "componentName": "Page",
            "fileName": "TextPage",
            "meta": {
                "id": 1, "title": "t", "router": "r", "creator": "a",
                "isHome": False, "parentId": "0", "rootElement": "div",
            },
            "children": [
                # a / h1 的 children 是字符串文本 —— 协议允许
                {"componentName": "a", "id": "l1", "children": "链接文本"},
                {"componentName": "h1", "id": "h1", "children": "标题文本"},
            ],
        }
        v = TinyEngineValidator(dsl)
        self.assertTrue(v.validate(), msg=str(v.errors))
        self.assertFalse(
            any('is not an object' in e for e in v.errors),
            f"字符串子节点不应被判为非对象: {v.errors}",
        )


@unittest.skipUnless(
    os.path.isdir(PAGES_DIR),
    f"找不到真实页面目录: {PAGES_DIR}",
)
class RealFileTests(unittest.TestCase):
    """对仓库内真实页面/区块文件跑端到端校验"""

    def _validate_file(self, path):
        import json
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        v = TinyEngineValidator(data)
        return v

    def test_real_login_page_passes(self):
        path = os.path.join(PAGES_DIR, 'Login.json')
        if not os.path.exists(path):
            self.skipTest("Login.json 不存在")
        v = self._validate_file(path)
        self.assertEqual(v.schema_type, 'page')
        self.assertTrue(v.validate(), msg=str(v.errors))

    def test_real_block_passes(self):
        path = os.path.join(BLOCKS_DIR, 'PortalBlock.json')
        if not os.path.exists(path):
            self.skipTest("PortalBlock.json 不存在")
        v = self._validate_file(path)
        self.assertEqual(v.schema_type, 'block')
        self.assertTrue(v.validate(), msg=str(v.errors))


if __name__ == '__main__':
    unittest.main(verbosity=2)
