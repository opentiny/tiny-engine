#!/usr/bin/env node
/**
 * TinyEngine Page DSL 综合验证
 *
 * 验证包装格式的页面DSL文件（包含 name, id, app, route, page_content 等字段）。
 * 运行所有检查：结构验证、事件绑定检查、CSS检查。
 *
 * 零依赖（仅用 Node 标准库）。
 * 通过子进程调用同目录下的 check_event_bindings.mjs / check_css.mjs（子进程直接继承 stdout/stderr）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

/** 普通对象判定（非 null、非数组） */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 把 JS 值映射为类型名，用于告警里的 "got: <类型>" 描述。 */
function typeName(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number';
    default:
      return 'object';
  }
}

/** 读取并解析 JSON 文件；失败时抛出 SyntaxError（JSON）或带 code 的系统错误（文件）。 */
function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

/** 验证包装格式的页面文件 */
function validatePageWrapper(filePath) {
  console.log(`验证文件: ${filePath}`);
  console.log('='.repeat(50));

  let data;
  try {
    data = readJson(filePath);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log(`❌ Invalid JSON: ${e.message}`);
    } else if (e.code === 'ENOENT') {
      console.log(`❌ File not found: ${filePath}`);
    } else {
      throw e;
    }
    return false;
  }

  // 检查是否是包装格式
  if (!('page_content' in data)) {
    console.log('❌ 不是有效的页面文件（缺少 page_content 字段）');
    return false;
  }

  const pageContent = data.page_content;

  // 检查必要字段
  for (const field of ['name', 'id', 'app', 'route']) {
    if (!(field in data)) {
      console.log(`❌ 缺少必要字段: ${field}`);
      return false;
    }
  }

  // 验证 app 字段格式：页面外层 app 引用必须是字符串。
  // pages.js list()/create() 均用 appId.toString() 查询，数字 app 会导致直接落盘的页面查不到。
  if ('app' in data) {
    const appField = data.app;
    if (typeof appField !== 'string') {
      console.log(
        `⚠️  WARNING: 'app' field should be string, got: ${typeName(appField)} (pages.js queries with appId.toString(); numeric app ref won't be found by list())`
      );
    }
  }

  // 检查 page_content 中的必要字段
  if (!('componentName' in pageContent)) {
    console.log('❌ page_content 缺少 componentName 字段');
    return false;
  }

  if (pageContent.componentName !== 'Page') {
    console.log(`❌ componentName 必须是 'Page'，实际是: ${pageContent.componentName}`);
    return false;
  }

  if (!('fileName' in pageContent)) {
    console.log('❌ page_content 缺少 fileName 字段');
    return false;
  }

  console.log('✅ 包装格式检查通过');
  return true;
}

/** 运行所有检查器 */
function runCheckers(filePath) {
  // 1. 事件绑定检查
  console.log('\n1️⃣ 事件绑定检查...');
  const eventResult = spawnSync(
    process.execPath,
    [path.join(SCRIPT_DIR, 'check_event_bindings.mjs'), filePath],
    { stdio: 'inherit' }
  );
  if (eventResult.status !== 0) return false;

  // 2. CSS 检查
  console.log('\n2️⃣ CSS 语法检查...');
  const cssResult = spawnSync(
    process.execPath,
    [path.join(SCRIPT_DIR, 'check_css.mjs'), filePath, 'basic'],
    { stdio: 'inherit' }
  );
  if (cssResult.status !== 0) return false;

  return true;
}

/** 检查是否正确使用 className 而不是 class */
function checkClassNameUsage(filePath) {
  let data;
  try {
    data = readJson(filePath);
  } catch (e) {
    // JSON 语法错误或文件读取问题（如 ENOENT）由其他检查负责报告；
    // 此处不掩盖其他意外运行错误。
    if (e instanceof SyntaxError || (e && typeof e.code === 'string')) {
      return true;
    }
    console.log(`❌ className 检查异常: ${e}`);
    return false;
  }

  const pageContent = Object.prototype.hasOwnProperty.call(data, 'page_content')
    ? data.page_content
    : {};
  const errors = [];

  const checkNode = (node) => {
    if (isPlainObject(node)) {
      // 检查 props 中是否有 'class'
      if ('props' in node && isPlainObject(node.props)) {
        if ('class' in node.props) {
          const component = Object.prototype.hasOwnProperty.call(node, 'componentName')
            ? node.componentName
            : 'unknown';
          errors.push(`${component} 使用了 'class' 而不是 'className'`);
        }
      }

      // 递归检查 children
      if (Array.isArray(node.children)) {
        for (const child of node.children) checkNode(child);
      }
    } else if (Array.isArray(node)) {
      for (const item of node) checkNode(item);
    }
  };

  checkNode(pageContent);

  if (errors.length) {
    console.log("\n❌ 发现错误的 'class' 使用（应该使用 'className'）:");
    for (const error of errors) console.log(`  - ${error}`);
    return false;
  }

  console.log('\n✅ className 检查通过');
  return true;
}

function main() {
  if (process.argv.length < 3) {
    console.log('Usage: validate_page.mjs <page-file>');
    console.log('验证包装格式的TinyEngine页面DSL文件');
    process.exit(1);
  }

  const filePath = process.argv[2];

  // 运行所有检查
  let allPassed = true;

  // 1. 包装格式检查
  if (!validatePageWrapper(filePath)) allPassed = false;

  // 2. className 检查
  if (!checkClassNameUsage(filePath)) allPassed = false;

  // 3. 运行其他检查器
  if (!runCheckers(filePath)) allPassed = false;

  // 总结
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ 所有验证通过!');
  } else {
    console.log('❌ 验证失败，请修复错误后重试');
  }

  process.exit(allPassed ? 0 : 1);
}

main();
