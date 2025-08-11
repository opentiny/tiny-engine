#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const raw = readFileSync(process.argv[2] || 'form.txt', 'utf8');

/**
 * 把一个段落按“列”拆成对象数组
 * 段落示例：
 *   属性名  说明    类型    默认值
 *   model   表单数据对象
 *   object
 *           —
 *   rules   表单验证规则
 *   object
 *           —
 *
 * 规则：
 * 1. 第一行一定是表头，用至少两个空格或 \t 分隔
 * 2. 后续行如果列数 < 表头列数，则自动向上补齐
 * 3. 支持单元格内部换行
 */
function parseTable(lines) {
  if (!lines.length) return [];
  const headerRaw = lines[0];
  // 用两个以上空格或 tab 切表头
  const headers = headerRaw.split(/  +|\t/).map(s => s.trim()).filter(Boolean);

  const rows = [];
  let curRow = Array(headers.length).fill('');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trimEnd(); // 保留内部空格
    if (!line) continue;             // 空行当段落分隔

    const cells = line.split(/  +|\t/).map(s => s.trim());
    if (cells.length === 1 && !cells[0]) continue;

    // 如果本行列数比表头少，则认为是“续行”，追加到上一行同列
    if (cells.length < headers.length) {
      for (let j = 0; j < cells.length; j++) {
        curRow[j] += (curRow[j] ? ' ' : '') + cells[j];
      }
    } else {
      // 先存上一行
      rows.push(curRow);
      // 新起一行
      curRow = Array(headers.length).fill('');
      for (let j = 0; j < Math.min(cells.length, headers.length); j++) {
        curRow[j] = cells[j];
      }
    }
  }
  if (curRow.some(c => c)) rows.push(curRow);

  // 转对象
  return rows.map(r =>
    Object.fromEntries(headers.map((h, idx) => [h, (r[idx] || '').trim()]))
  );
}

/**
 * 主解析器
 * 1. 按空行分块
 * 2. 每个块首行是标题（如 "Form Attributes"）
 * 3. 标题后的非空行就是表格
 */
function parseAll(rawText) {
  const blocks = rawText.split(/\n\s*\n/).map(b => b.split('\n').filter(l => l.trim()));
  const result = {};

  for (const block of blocks) {
    if (block.length < 2) continue;
    const title = block[0].trim();
    const table = parseTable(block.slice(1));
    if (!table.length) continue;

    // 将标题做 key：Form Attributes -> attributes
    const key = title
      .replace(/\s+/g, '_')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

    result[key] = table;
  }
  return result;
}

const json = parseAll(raw);
console.log(JSON.stringify(json, null, 2));