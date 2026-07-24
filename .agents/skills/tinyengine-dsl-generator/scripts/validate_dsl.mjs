#!/usr/bin/env node
/**
 * TinyEngine DSL Validator
 *
 * 验证生成的DSL是否符合TinyEngine协议规范。
 *
 * 零依赖（仅用 Node 标准库）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

/** 普通对象判定（非 null、非数组） */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class TinyEngineValidator {
  /**
   * @param {*} dslData DSL 数据
   * @param {string} [schemaType='auto'] 'page' | 'block' | 'app' | 'auto'
   */
  constructor(dslData, schemaType = 'auto') {
    this.original = dslData;
    // 落盘文件是"外层包装 + 内层 DSL"，这里解包到内层 DSL 再做协议校验。
    const [dsl, fromWrapper] = TinyEngineValidator._unwrap(dslData);
    this.dsl = dsl;
    this._fromWrapper = fromWrapper;
    this.schemaType = schemaType;
    this.errors = [];
    this.warnings = [];

    // 自动检测 schema 类型
    if (schemaType === 'auto') {
      this.schemaType = this._detectSchemaType();
    }
  }

  /**
   * 识别并解包外层包装结构。
   * TinyEngine 落盘的页面/区块文件是"外层包装 + 内层 DSL"结构：
   *   - 页面：真正的页面 DSL 在 page_content 内
   *   - 区块：真正的区块 DSL 在 content 内
   * 返回 [内层DSL, 是否来自包装]。若不是包装结构，原样返回 [原数据, false]。
   * 仅当内层确实是含 componentName 的节点时才解包，避免误吞同名普通字段。
   */
  static _unwrap(dslData) {
    if (isPlainObject(dslData)) {
      for (const key of ['page_content', 'content']) {
        const inner = dslData[key];
        if (isPlainObject(inner) && 'componentName' in inner) {
          return [inner, true];
        }
      }
    }
    return [dslData, false];
  }

  /** 自动检测 schema 类型 */
  _detectSchemaType() {
    if ('componentName' in this.dsl) {
      const cn = this.dsl.componentName;
      if (cn === 'Page') return 'page';
      if (cn === 'Block') return 'block';
      // 其它 componentName 落到 unknown（不进入 app 分支）
    } else if ('componentsTree' in this.dsl || 'version' in this.dsl) {
      return 'app';
    }
    return 'unknown';
  }

  /** 验证 DSL，返回是否有效 */
  validate() {
    if (this.schemaType === 'page') return this._validatePage();
    if (this.schemaType === 'block') return this._validateBlock();
    if (this.schemaType === 'app') return this._validateApp();
    this.errors.push(`Unknown schema type: ${this.schemaType}`);
    return false;
  }

  _validatePage() {
    for (const field of ['componentName', 'fileName']) {
      if (!(field in this.dsl)) this.errors.push(`Missing required field: ${field}`);
    }

    if (this.dsl.componentName !== 'Page') {
      this.errors.push(`Page componentName must be 'Page', got: ${this.dsl.componentName}`);
    }

    // Page 外层包装的 app 引用必须是字符串：pages.js list()/create() 均用 appId.toString()
    // 查询；写成数字会导致直接落盘的 page 文件查不到。
    if (this._fromWrapper && isPlainObject(this.original)) {
      const appRef = this.original.app;
      if (appRef !== undefined && typeof appRef !== 'string') {
        this.warnings.push(
          `Page wrapper 'app' should be string, got: ${typeName(appRef)} (pages.js queries with appId.toString(); numeric app ref won't be found by list())`
        );
      }
    }

    // 原始页面协议(IPageSchema)要求 meta；但外层包装格式把 meta 等元信息上提到包装层，
    // page_content 内不再含 meta。因此仅在校验"裸"页面 DSL 时强制要求 meta。
    if ('meta' in this.dsl) {
      this._validateMeta(this.dsl.meta);
    } else if (!this._fromWrapper) {
      this.errors.push('Missing required field: meta');
    }

    if (this.dsl.children) {
      this._validateChildren(this.dsl.children);
    }

    return this.errors.length === 0;
  }

  _validateBlock() {
    for (const field of ['componentName', 'fileName']) {
      if (!(field in this.dsl)) this.errors.push(`Missing required field: ${field}`);
    }

    if (this.dsl.componentName !== 'Block') {
      this.errors.push(`Block componentName must be 'Block', got: ${this.dsl.componentName}`);
    }

    if ('schema' in this.dsl) {
      this._validateBlockSchema(this.dsl.schema);
    }

    if (this.dsl.children) {
      this._validateChildren(this.dsl.children);
    }

    return this.errors.length === 0;
  }

  _validateApp() {
    for (const field of ['version', 'componentsMap', 'componentsTree']) {
      if (!(field in this.dsl)) this.errors.push(`Missing required field: ${field}`);
    }

    // 验证 app ID 格式
    if ('id' in this.dsl) {
      const rootId = this.dsl.id;
      if (!Number.isInteger(rootId)) {
        this.warnings.push(`App Schema 'id' should be integer, got: ${typeName(rootId)} (will be coerced)`);
      }
    }

    // 验证 meta.appId 格式
    if ('meta' in this.dsl && 'appId' in this.dsl.meta) {
      const appId = this.dsl.meta.appId;
      if (!Number.isInteger(appId)) {
        this.warnings.push(`meta.appId should be integer, got: ${typeName(appId)} (will be coerced)`);
      }
    }

    // 验证 componentsMap
    if ('componentsMap' in this.dsl) {
      this._validateComponentsMap(this.dsl.componentsMap);
    }

    // 验证 componentsTree
    if ('componentsTree' in this.dsl) {
      for (const page of this.dsl.componentsTree) {
        const pageValidator = new TinyEngineValidator(page, 'auto');
        if (!pageValidator.validate()) {
          const fileName = Object.prototype.hasOwnProperty.call(page, 'fileName') ? page.fileName : '?';
          for (const e of pageValidator.errors) {
            this.errors.push(`[Page ${fileName}] ${e}`);
          }
        }
      }
    }

    return this.errors.length === 0;
  }

  _validateMeta(meta) {
    for (const field of ['id', 'title', 'router', 'creator', 'isHome', 'parentId', 'rootElement']) {
      if (!(field in meta)) this.errors.push(`Missing meta field: ${field}`);
    }
  }

  _validateComponentsMap(componentsMap) {
    for (const comp of componentsMap) {
      for (const field of ['componentName', 'package', 'exportName']) {
        if (!(field in comp)) this.errors.push(`componentsMap missing field: ${field}`);
      }
    }
  }

  _validateBlockSchema(schema) {
    if ('properties' in schema) {
      for (const prop of schema.properties) {
        if (!('content' in prop)) this.errors.push("Block schema property missing 'content'");
      }
    }
  }

  _validateChildren(children) {
    // children 可以是字符串（文本子节点），按协议(IComponentSchema[] | string)
    // 这是合法形态，无需逐项校验；递归调用遇到字符串时同样直接返回。
    if (typeof children === 'string') return;

    children.forEach((child, i) => {
      if (!isPlainObject(child)) {
        this.errors.push(`Child at index ${i} is not an object`);
        return;
      }

      if (!('componentName' in child)) {
        this.errors.push(`Child at index ${i} missing componentName`);
      }

      // 检查 ID
      if (!('id' in child)) {
        this.warnings.push(`Child at index ${i} missing id (recommended)`);
      }

      // 检查 props 中是否有错误的 'class' 字段（应该是 'className'）
      if ('props' in child && isPlainObject(child.props)) {
        if ('class' in child.props) {
          const component = Object.prototype.hasOwnProperty.call(child, 'componentName') ? child.componentName : 'unknown';
          this.errors.push(
            `${component} at index ${i} uses 'class' in props, should use 'className' instead (React/Vue convention)`
          );
        }
      }

      // 验证嵌套 children
      if (child.children) {
        this._validateChildren(child.children);
      }
    });
  }

  /** 生成验证报告 */
  report() {
    const lines = [];
    if (this.errors.length) {
      lines.push('❌ Validation Errors:');
      for (const error of this.errors) lines.push(`  - ${error}`);
    }
    if (this.warnings.length) {
      lines.push('⚠️ Warnings:');
      for (const warning of this.warnings) lines.push(`  - ${warning}`);
    }
    if (this.errors.length === 0 && this.warnings.length === 0) {
      lines.push('✅ Validation passed!');
    }
    return lines.join('\n');
  }
}

function main() {
  if (process.argv.length < 3) {
    console.log('Usage: validate_dsl.mjs <dsl-file> [schema-type]');
    console.log('  schema-type: page, block, app, or auto (default)');
    process.exit(1);
  }

  const filePath = process.argv[2];
  const schemaType = process.argv[3] || 'auto';

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

  const validator = new TinyEngineValidator(dslData, schemaType);
  const isValid = validator.validate();
  console.log(validator.report());
  process.exit(isValid ? 0 : 1);
}

const __filename = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] || '') === __filename) {
  main();
}
