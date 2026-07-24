#!/usr/bin/env node
/**
 * TinyEngine CSS Syntax Checker
 *
 * 检查DSL中的CSS字段是否有语法错误（基础模式：括号匹配、基本语法，无需额外依赖）。
 *
 * 零依赖（仅用 Node 标准库）。
 * （原 tinycss2 / postcss 模式依赖外部环境，已精简；basic 是默认且为编排脚本使用的模式。）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 普通对象判定（非 null、非数组） */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 解包外层包装结构，返回内层 DSL（页面在 page_content 内，区块在 content 内）。
 * 仅当内层确实是含 componentName 的节点时才解包；否则原样返回。
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

/** CSS 语法检查器（基础模式，无需额外依赖） */
export class BasicCssChecker {
  /** @param {*} dslData */
  constructor(dslData) {
    this.dsl = dslData;
    this.errors = [];
    this.warnings = [];
  }

  /** 检查 CSS 语法 */
  check() {
    // 从外层包装(page_content/content)解包到内层 DSL 后再读取 css
    const inner = extractInnerDsl(this.dsl);
    const cssString = inner.css ?? '';

    if (!cssString) {
      this.warnings.push('No CSS field found');
      return true;
    }

    return this._checkCss(cssString);
  }

  /** 基础检查：括号匹配、基本语法 */
  _checkCss(css) {
    // 检查括号匹配
    const stack = [];
    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      if (char === '{') {
        stack.push([char, i]);
      } else if (char === '}') {
        if (stack.length === 0 || stack[stack.length - 1][0] !== '{') {
          this.errors.push(`Unmatched '}' at position ${i}`);
          return false;
        }
        stack.pop();
      } else if (char === '(') {
        stack.push([char, i]);
      } else if (char === ')') {
        if (stack.length === 0 || stack[stack.length - 1][0] !== '(') {
          this.errors.push(`Unmatched ')' at position ${i}`);
          return false;
        }
        stack.pop();
      }
    }

    if (stack.length) {
      for (const [char, pos] of stack) {
        this.errors.push(`Unclosed '${char}' at position ${pos}`);
      }
      return false;
    }

    // 移除注释进行检查
    const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // 检查是否有 CSS 规则
    if (!cssNoComments.includes('{')) {
      this.warnings.push('CSS may not contain any rules');
    }

    // 检查分号使用
    const rules = [...cssNoComments.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
    for (const rule of rules) {
      const properties = rule.split(';');
      // 最后一个可能为空
      for (const propRaw of properties.slice(0, -1)) {
        const prop = propRaw.trim();
        if (prop && !prop.includes(':')) {
          this.warnings.push(`Property without colon: ${prop.slice(0, 50)}`);
        }
      }
    }

    return this.errors.length === 0;
  }

  /** 生成报告 */
  report() {
    const lines = [];
    if (this.errors.length) {
      lines.push('❌ CSS Errors:');
      for (const error of this.errors) lines.push(`  - ${error}`);
    }
    if (this.warnings.length) {
      lines.push('⚠️ CSS Warnings:');
      for (const warning of this.warnings) lines.push(`  - ${warning}`);
    }
    if (this.errors.length === 0 && this.warnings.length === 0) {
      lines.push('✅ CSS check passed!');
    }
    return lines.join('\n');
  }
}

// 可用模式表（仅保留 basic）
const CHECKERS = { basic: BasicCssChecker };

function main() {
  if (process.argv.length < 3) {
    console.log('Usage: check_css.mjs <dsl-file> [mode]');
    console.log('  mode: basic (default)');
    process.exit(1);
  }

  const filePath = process.argv[2];
  const mode = process.argv[3] || 'basic';

  // 读取 DSL 文件
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

  // 选择检查器
  const CheckerClass = CHECKERS[mode];
  if (!CheckerClass) {
    console.log(`❌ Unknown mode: ${mode}`);
    console.log(`Available modes: ${Object.keys(CHECKERS).join(', ')}`);
    process.exit(1);
  }

  const checker = new CheckerClass(dslData);
  const isValid = checker.check();
  console.log(checker.report());
  process.exit(isValid ? 0 : 1);
}

const __filename = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] || '') === __filename) {
  main();
}
