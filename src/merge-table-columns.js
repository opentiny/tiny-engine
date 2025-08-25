const fs = require('fs').promises;
const path = require('path');

/**
 * 读取 JSON 文件
 * @param {string} filePath - 文件路径（支持相对/绝对路径）
 * @returns {Promise<object>} JSON 解析后的对象
 */
async function readJsonFile(filePath) {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  try {
    const content = await fs.readFile(resolvedPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 读取文件 ${resolvedPath} 失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 处理 ElTableColumn 的属性，提取所需字段（按模板格式）
 * @param {object} tableColumnJson - ElTableColumn.json 解析后的对象
 * @returns {Array} 整理后的 content 数组（单个 columns 属性）
 */
function processTableColumnContent(tableColumnJson) {
  // 1. 获取 ElTableColumn 中所有属性分组的 content（基础/样式/行为/高级属性）
  const columnPropertyGroups = tableColumnJson.schema?.properties || [];
  if (!columnPropertyGroups.length) {
    console.warn('⚠️ ElTableColumn.json 中未找到 schema.properties 数据，将生成空的 columns 配置');
    return [];
  }

  // 2. 合并所有分组的 content 数组（收集所有 ElTableColumn 属性）
  const allColumnProperties = columnPropertyGroups.reduce((acc, group) => {
    return acc.concat(group.content || []);
  }, []);

  // 3. 按用户模板格式，构建单个 columns 属性（包含所有 ElTableColumn 子属性）
  return [
    {
      "property": "columns",
      "label": {
        "text": {
          "zh_CN": "表格列"
        }
      },
      "required": true,
      "readOnly": false,
      "disabled": false,
      "cols": 12,
      "properties": [
        {
          "label": {
            "zh_CN": "默认分组"
          },
          "content": allColumnProperties.map(prop => ({
            // 提取 ElTableColumn 每个属性的核心字段
            "property": prop.property || "",
            "type": prop.type || "",
            "defaultValue": prop.defaultValue !== undefined ? prop.defaultValue : "",
            "label": {
              "text": {
                "zh_CN": prop.label?.text?.zh_CN || ""
              }
            },
            "widget": {
              "component": prop.widget?.component || "",
              "props": prop.widget?.props || {}
            }
          }))
        }
      ],
      "widget": {
        "component": "ArrayItemConfigurator",
        "props": {
          "type": "object",
          "textField": "title",
          "language": "json",
          "buttonText": "编辑列配置",
          "title": "编辑列配置",
          "expand": true
        }
      },
      "description": {
        "zh_CN": "表格列的配置信息"
      },
      "labelPosition": "left"
    }
  ];
}

/**
 * 核心合并函数：将 ElTableColumn 整理为 columns 属性，插入 ElTable 基础属性的 content 中
 * @param {string} elTablePath - ElTable.json 文件路径
 * @param {string} elTableColumnPath - ElTableColumn.json 文件路径
 * @param {string} outputPath - 合并后输出文件路径（默认：ElTable_merged.json）
 */
async function mergeTableColumns(elTablePath, elTableColumnPath, outputPath = 'ElTable_merged.json') {
  try {
    // 1. 读取两个源文件
    console.log(`📥 正在读取文件...`);
    const elTableJson = await readJsonFile(elTablePath);
    const elTableColumnJson = await readJsonFile(elTableColumnPath);

    // 2. 处理 ElTableColumn 数据，生成 columns 属性
    console.log(`🔧 正在处理表格列配置...`);
    const columnsContent = processTableColumnContent(elTableColumnJson);

    // 3. 定位 ElTable 的「基础属性」分组（name: "0" 或 label.zh_CN: "基础属性"）
    const basePropertyGroup = elTableJson.schema?.properties?.find(
      group => group.name === "0" || group.label?.zh_CN === "基础属性"
    );

    if (!basePropertyGroup) {
      // 若未找到基础属性分组，自动创建（避免破坏原有结构）
      console.warn('⚠️ ElTable.json 中未找到「基础属性」分组，将自动创建');
      elTableJson.schema = elTableJson.schema || {};
      elTableJson.schema.properties = elTableJson.schema.properties || [];
      elTableJson.schema.properties.unshift({
        "name": "0",
        "label": { "zh_CN": "基础属性" },
        "description": { "zh_CN": "组件核心功能相关的配置，包含表格列、数据、高度等" },
        "content": columnsContent // 新分组直接包含 columns 属性
      });
    } else {
      // 若找到基础属性分组，将 columns 属性插入其 content 数组开头
      basePropertyGroup.content = basePropertyGroup.content || [];
      basePropertyGroup.content.unshift(...columnsContent);
    }

    // 4. 写入合并后的文件
    const timestamp = new Date().getTime();
    const resolvedOutputPath = path.resolve(process.cwd(), `${outputPath}-${timestamp}`);
    await fs.writeFile(resolvedOutputPath, JSON.stringify(elTableJson, null, 2), 'utf8');
    console.log(`✅ 合并成功！输出文件：${resolvedOutputPath}`);
  } catch (error) {
    console.error('❌ 合并过程失败:', error.message);
    process.exit(1);
  }
}

// 命令行运行入口（支持传入文件路径参数）
if (require.main === module) {
  // 解析命令行参数：node merge-table-columns.js <ElTable路径> <ElTableColumn路径> [输出路径]
  const [elTablePath, elTableColumnPath, outputPath] = process.argv.slice(2);

  // 校验必填参数
  if (!elTablePath || !elTableColumnPath) {
    console.log('📋 使用说明：node merge-table-columns.js <ElTable.json路径> <ElTableColumn.json路径> [输出文件路径]');
    console.log('示例：node merge-table-columns.js ./ElTable.json ./ElTableColumn.json ./ElTable_merged.json');
    process.exit(0);
  }

  // 执行合并
  mergeTableColumns(elTablePath, elTableColumnPath, outputPath);
}

// 导出函数（支持模块化调用）
module.exports = { mergeTableColumns };