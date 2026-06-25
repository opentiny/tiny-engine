#!/usr/bin/env node
/**
 * TinyEngine Component Catalog Query
 *
 * 从 designer-demo/public/mock/bundle.json 查询组件元数据，
 * 避免把 ~1MB 全量清单加载进上下文。零依赖（仅用 Node 标准库）。
 *
 * 用法:
 *   node query_components.mjs list                    列出全部组件（名 / 中文名 / 分类 / 描述）
 *   node query_components.mjs categories              列出所有分类及组件数
 *   node query_components.mjs cat <分类关键字>        列出某分类下的组件
 *   node query_components.mjs props <组件名或中文>    查某组件的属性表（支持模糊匹配）
 *   node query_components.mjs search <关键字>         按名 / 中文名 / 描述 / 分类搜索
 *
 *   可用 BUNDLE_JSON=<path> 环境变量覆盖 bundle.json 位置。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
// scripts/ → tinyengine-dsl-generator → skills → .agents → 仓库根
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..', '..');
const DEFAULT_BUNDLE = path.join(REPO_ROOT, 'designer-demo', 'public', 'mock', 'bundle.json');

function loadComponents() {
  const file = process.env.BUNDLE_JSON || DEFAULT_BUNDLE;
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`❌ 找不到 bundle.json: ${file}（可用 BUNDLE_JSON=<path> 覆盖）`);
    } else if (e instanceof SyntaxError) {
      console.error(`❌ bundle.json 解析失败: ${e.message}`);
    } else {
      throw e;
    }
    process.exit(1);
  }
  return json?.data?.materials?.components ?? [];
}

/** 取一个节点的中文标签，兼容 label.text.zh_CN / label.zh_CN / name.zh_CN */
function zhLabel(node) {
  if (!node) return '';
  return node.text?.zh_CN || node.label?.text?.zh_CN || node.label?.zh_CN || node.name?.zh_CN || '';
}

/** 组件名（强制字符串，少数条目 component 字段非字符串） */
function cname(c) {
  return String(c?.component ?? '');
}

function truncate(s, n = 46) {
  s = (s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function pad(s, n) {
  s = String(s ?? '');
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function listAll(comps) {
  console.log(`${pad('componentName', 22)} ${pad('中文名', 12)} ${pad('category', 12)} description`);
  console.log('-'.repeat(86));
  for (const c of comps) {
    console.log(`${pad(c.component, 22)} ${pad(zhLabel(c), 12)} ${pad(c.category || '', 12)} ${truncate(c.description)}`);
  }
  console.log(`\n共 ${comps.length} 个组件`);
}

function categories(comps) {
  const m = new Map();
  for (const c of comps) {
    const k = c.category || '(无分类)';
    m.set(k, (m.get(k) || 0) + 1);
  }
  for (const [k, n] of [...m].sort((a, b) => b[1] - a[1])) {
    console.log(`${pad(k, 16)} ${n}`);
  }
}

function byCategory(comps, cat) {
  const hits = comps.filter((c) => (c.category || '').toLowerCase().includes(cat.toLowerCase()));
  if (hits.length === 0) {
    console.log(`没有匹配分类 "${cat}" 的组件。运行 "categories" 查看全部分类。`);
    return;
  }
  console.log(`分类匹配 "${cat}"（${hits.length} 个）:`);
  for (const c of hits) console.log(`  ${pad(c.component, 22)} ${pad(zhLabel(c), 12)} ${truncate(c.description)}`);
}

/** 精确 → 模糊（componentName / 中文名）匹配，返回单个 / 多个 / 未命中 */
function findComp(comps, name) {
  const exact = comps.find((c) => cname(c) === name);
  if (exact) return { comp: exact };

  const lower = name.toLowerCase();
  const byName = comps.filter((c) => cname(c).toLowerCase().includes(lower));
  if (byName.length === 1) return { comp: byName[0] };

  const byZh = comps.filter((c) => zhLabel(c).includes(name));
  if (byZh.length === 1) return { comp: byZh[0] };

  const pooled = new Map();
  for (const c of [...byName, ...byZh]) pooled.set(cname(c), c);
  if (pooled.size > 0) return { multiple: [...pooled.values()] };
  return {};
}

function showProps(comp) {
  console.log(`${comp.component} — ${zhLabel(comp)}（分类: ${comp.category || '?'}）`);
  if (comp.description) console.log(comp.description);
  if (comp.npm?.package) {
    const imp = comp.npm.destructuring ? `{ ${comp.npm.exportName} }` : comp.npm.exportName;
    console.log(`npm: ${comp.npm.package}  ${imp}`);
  }
  console.log('');
  const groups = comp.schema?.properties || [];
  if (groups.length === 0) {
    console.log('（该组件无 props schema）');
    return;
  }
  console.log(`${pad('property', 18)}${pad('widget', 22)}${pad('required', 9)}label / description`);
  console.log('-'.repeat(86));
  let count = 0;
  for (const g of groups) {
    for (const item of g.content || []) {
      const prop = item.property || '?';
      const widget = item.widget?.component || '';
      const req = item.required ? 'required' : '';
      const desc = truncate(item.description?.zh_CN || zhLabel(item), 40);
      console.log(`${pad(prop, 18)}${pad(widget, 22)}${pad(req, 9)}${desc}`);
      count++;
    }
  }
  console.log(`\n共 ${count} 个属性`);
}

function search(comps, kw) {
  const lower = kw.toLowerCase();
  const hits = comps.filter(
    (c) =>
      cname(c).toLowerCase().includes(lower) ||
      zhLabel(c).includes(kw) ||
      (c.description || '').toLowerCase().includes(lower) ||
      (c.category || '').toLowerCase().includes(lower)
  );
  if (hits.length === 0) {
    console.log(`没有匹配 "${kw}" 的组件。`);
    return;
  }
  console.log(`匹配 "${kw}"（${hits.length} 个）:`);
  for (const c of hits) console.log(`  ${pad(c.component, 22)} ${pad(zhLabel(c), 12)} ${pad(c.category || '', 10)} ${truncate(c.description, 34)}`);
}

function usage() {
  console.log(`TinyEngine 组件查询

用法:
  node query_components.mjs list                   列出全部组件
  node query_components.mjs categories             列出分类
  node query_components.mjs cat <分类>             某分类下的组件
  node query_components.mjs props <组件名|中文>    某组件的属性表（模糊匹配）
  node query_components.mjs search <关键字>        全字段搜索

示例:
  node query_components.mjs props TinyButton
  node query_components.mjs props button
  node query_components.mjs cat 表单`);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const comps = loadComponents();

  switch (cmd) {
    case undefined:
    case '--help':
    case '-h':
      return usage();
    case 'list':
      return listAll(comps);
    case 'categories':
    case 'cats':
      return categories(comps);
    case 'cat':
      if (!rest[0]) return usage();
      return byCategory(comps, rest.join(' '));
    case 'props':
      if (!rest[0]) return usage();
      {
        const r = findComp(comps, rest.join(' '));
        if (r.comp) return showProps(r.comp);
        if (r.multiple) {
          console.log(`"${rest.join(' ')}" 匹配到多个组件，请指定更精确的名字:`);
          for (const c of r.multiple) console.log(`  ${pad(c.component, 22)} ${zhLabel(c)}`);
          return;
        }
        console.log(`未找到组件 "${rest.join(' ')}"。运行 "list" 查看全部，或用 "search <关键字>"。`);
      }
      return;
    case 'search':
      if (!rest[0]) return usage();
      return search(comps, rest.join(' '));
    default:
      console.error(`未知命令: ${cmd}`);
      return usage();
  }
}

main();
