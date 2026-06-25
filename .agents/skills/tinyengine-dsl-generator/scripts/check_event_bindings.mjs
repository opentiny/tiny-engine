#!/usr/bin/env node
/**
 * TinyEngine Event Binding Checker
 *
 * 检查DSL文件中的事件绑定是否正确使用JSExpression引用方法，
 * 而不是在value中直接写函数定义。
 *
 * 零依赖（仅用 Node 标准库）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 普通对象判定（非 null、非数组） */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 解包外层包装结构，返回内层 DSL。
 * 落盘的页面/区块文件是"外层包装 + 内层 DSL"：
 *   - 页面 DSL 在 page_content 内
 *   - 区块 DSL 在 content 内
 * 仅当内层确实是含 componentName 的节点时才解包，避免误吞同名普通字段；否则原样返回。
 */
function extractInnerDsl(dslData) {
  if (isPlainObject(dslData)) {
    for (const key of ['page_content', 'content']) {
      const inner = dslData[key];
      if (isPlainObject(inner) && 'componentName' in inner) {
        return inner;
      }
    }
  }
  return dslData;
}

const EVENT_KEYS = [
  'onClick', 'onChange', 'onKeyup', 'onKeyDown', 'onKeyPress',
  'onFocus', 'onBlur', 'onSubmit', 'onInput', 'onTabClick',
  'onCurrentChange', 'onSizeChange', 'onCheckChange',
  'onNodeClick', 'onRowClick', 'onCellClick',
];

export class EventBindingChecker {
  /** @param {*} dslData */
  constructor(dslData) {
    this.dsl = dslData;
    this.errors = [];
    this.warnings = [];
  }

  /** 检查所有事件绑定 */
  check() {
    // 从外层包装(page_content/content)解包到内层 DSL 后再检查
    const inner = extractInnerDsl(this.dsl);
    this._checkNode(inner);
    return this.errors.length === 0;
  }

  /** 递归检查节点 */
  _checkNode(node) {
    if (isPlainObject(node)) {
      // 检查当前节点的事件绑定
      this._checkEventBindings(node);

      // 递归检查子节点（仅当 children 是数组；字符串子节点无需处理）
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          this._checkNode(child);
        }
      }
    } else if (Array.isArray(node)) {
      for (const item of node) {
        this._checkNode(item);
      }
    }
  }

  /** 检查单个节点的事件绑定（含 props 内的事件绑定） */
  _checkEventBindings(node) {
    const component = Object.prototype.hasOwnProperty.call(node, 'componentName') ? node.componentName : 'unknown';

    // 两处都需要校验，避免漏检 props 内的事件。
    this._checkEventHolder(node, component);
    if (isPlainObject(node.props)) {
      this._checkEventHolder(node.props, component);
    }
  }

  /** 检查某个属性容器（节点本身或其 props）内的事件绑定 */
  _checkEventHolder(holder, component) {
    // 检查所有可能的事件属性
    for (const key of EVENT_KEYS) {
      if (key in holder) {
        const value = holder[key];
        if (isPlainObject(value)) {
          this._checkEventValue(component, key, value);
        }
      }
    }

    // 也检查以 'on' 开头的属性
    for (const [key, value] of Object.entries(holder)) {
      if (key.startsWith('on') && !EVENT_KEYS.includes(key)) {
        if (isPlainObject(value)) {
          this._checkEventValue(component, key, value);
        }
      }
    }
  }

  /** 检查事件值 */
  _checkEventValue(component, eventKey, value) {
    const valueType = value.type;
    const valueContent = Object.prototype.hasOwnProperty.call(value, 'value') ? value.value : '';

    // 错误1: 使用 JSFunction 类型进行事件绑定
    if (valueType === 'JSFunction') {
      this.errors.push(
        `${component}.${eventKey}: 使用了JSFunction类型，应该使用JSExpression引用methods中的方法`
      );
    }

    // 错误2: JSExpression 的 value 中包含函数定义
    if (valueType === 'JSExpression' && typeof valueContent === 'string' && valueContent.startsWith('function')) {
      this.errors.push(
        `${component}.${eventKey}: JSExpression的value中包含函数定义 '${valueContent.slice(0, 30)}...'，` +
          `应该引用方法如 'this.methodName'`
      );
    }
  }

  /** 生成报告 */
  report() {
    const lines = [];
    if (this.errors.length) {
      lines.push('❌ 发现事件绑定错误:');
      for (const error of this.errors) lines.push(`  - ${error}`);
    }
    if (this.warnings.length) {
      lines.push('⚠️  警告:');
      for (const warning of this.warnings) lines.push(`  - ${warning}`);
    }
    if (this.errors.length === 0 && this.warnings.length === 0) {
      lines.push('✅ 所有事件绑定检查通过!');
    }
    return lines.join('\n');
  }
}

function main() {
  if (process.argv.length < 3) {
    console.log('Usage: check_event_bindings.mjs <dsl-file>');
    process.exit(1);
  }

  const filePath = process.argv[2];

  let dslData;
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    dslData = JSON.parse(text);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log(`❌ Invalid JSON: ${e.message}`);
    } else if (e.code === 'ENOENT') {
      console.log(`❌ File not found: ${filePath}`);
    } else {
      throw e;
    }
    process.exit(1);
  }

  const checker = new EventBindingChecker(dslData);
  const isValid = checker.check();
  console.log(checker.report());
  process.exit(isValid ? 0 : 1);
}

const __filename = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] || '') === __filename) {
  main();
}
