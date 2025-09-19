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
  console.log(`🔧 表格列schema属性数据:${columnPropertyGroups}`);
  if (!columnPropertyGroups.length) {
    console.warn('⚠️ ElTableColumn.json 中未找到 schema.properties 数据，将生成空的 columns 配置');
    return [];
  }

  // 2. 合并所有分组的 content 数组（收集所有 ElTableColumn 属性）
  const allColumnProperties = columnPropertyGroups.reduce((acc, group) => {
    return acc.concat(group.content || []);
  }, []);

  // 3. 构建单个 columns 属性（包含所有 ElTableColumn 子属性）
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
 * 核心合并函数：接收两个JSON对象，将 ElTableColumn 整理为 columns 属性插入 ElTable
 * @param {object} elTableJson - ElTable 解析后的JSON对象
 * @param {object} elTableColumnJson - ElTableColumn 解析后的JSON对象
 * @returns {object} 合并后的完整JSON对象（含 columns 属性）
 */
function mergeTableColumns(elTableJson, elTableColumnJson) {
  try {
    // 新增：检查输入的schema是否有效
    if (!elTableJson?.schema) {
      throw new Error("ElTable的schema不存在或为空");
    }
    if (!elTableColumnJson?.schema) {
      throw new Error("ElTableColumn的schema不存在或为空");
    }

    // 1. 深拷贝 ElTable JSON（避免修改原对象，保持纯函数特性）
    const mergedElTableJson = JSON.parse(JSON.stringify(elTableJson));
    const mergedElTableColumnJson  = JSON.parse(JSON.stringify(elTableColumnJson));

    // 2. 处理 ElTableColumn 数据，生成 columns 属性
    console.log(`🔧 正在处理表格列配置...`);
    const columnsContent = processTableColumnContent(mergedElTableColumnJson );

    // 3. 定位或创建 ElTable 的「基础属性」分组
    const basePropertyGroup = mergedElTableJson.schema?.properties?.find(
      group => group.name === "0" || group.label?.zh_CN === "基础属性"
    );

    if (!basePropertyGroup) {
      // 未找到基础属性分组时自动创建
      console.warn('⚠️ ElTable JSON 中未找到「基础属性」分组，将自动创建');
      mergedElTableJson.schema = mergedElTableJson.schema || {};
      mergedElTableJson.schema.properties = mergedElTableJson.schema.properties || [];
      mergedElTableJson.schema.properties.unshift({
        "name": "0",
        "label": { "zh_CN": "基础属性" },
        "description": { "zh_CN": "组件核心功能相关的配置，包含表格列、数据、高度等" },
        "content": columnsContent // 新分组直接包含 columns 属性
      });
    } else {
      // 找到基础属性分组，将 columns 属性插入 content 开头
      basePropertyGroup.content = basePropertyGroup.content || [];
      // basePropertyGroup.content.unshift(...columnsContent);

      // 查找已存在的columns属性索引
      const existingColumnsIndex = basePropertyGroup.content.findIndex(
        item => item.property === 'columns'
      );
      
      if (existingColumnsIndex !== -1) {
        // 存在则覆盖
        console.log(`🔄 已发现现有columns属性，将进行覆盖`);
        basePropertyGroup.content.splice(existingColumnsIndex, 1, ...columnsContent);
      } else {
        // 不存在则添加到开头
        basePropertyGroup.content.unshift(...columnsContent);
      }
    }

    console.log(`✅ JSON 对象合并完成（已添加 columns 属性）`);
    return mergedElTableJson; // 返回合并后的JSON对象
  } catch (error) {
    console.error('❌ JSON 合并过程失败:', error.message);
    throw error; // 抛出错误供外部捕获
  }
}

// 命令行运行入口：负责文件读写+调用合并函数
if (require.main === module) {
  // 解析命令行参数：node merge-table-columns.js <ElTable路径> <ElTableColumn路径> [输出路径]
  const [elTablePath, elTableColumnPath, outputPath] = process.argv.slice(2);

  // 校验必填参数
  if (!elTablePath || !elTableColumnPath) {
    console.log('📋 使用说明：node merge-table-columns.js <ElTable.json路径> <ElTableColumn.json路径> [输出文件路径]');
    console.log('示例：node merge-table-columns.js ./ElTable.json ./ElTableColumn.json ./ElTable_merged');
    process.exit(0);
  }

  // 异步执行文件读写+合并逻辑
  (async () => {
    try {
      // 1. 读取两个源文件的JSON对象
      console.log(`📥 正在读取文件...`);
      const elTableJson = await readJsonFile(elTablePath);
      const elTableColumnJson = await readJsonFile(elTableColumnPath);

      // 2. 调用核心合并函数，获取合并后的JSON
      const mergedJson = mergeTableColumns(elTableJson, elTableColumnJson);

      // 3. 处理输出路径（默认带时间戳+JSON后缀）
      const baseOutputPath = outputPath || 'ElTable_merged';
      const timestamp = new Date().getTime();
      const resolvedOutputPath = path.resolve(
        process.cwd(),
        `${baseOutputPath}-${timestamp}.json`
      );

      // 4. 写入合并后的文件
      await fs.writeFile(resolvedOutputPath, JSON.stringify(mergedJson, null, 2), 'utf8');
      console.log(`✅ 合并文件已保存：${resolvedOutputPath}`);
    } catch (error) {
      console.error('❌ 整体流程失败:', error.message);
      process.exit(1);
    }
  })();
}

// 导出函数（支持模块化调用，外部可直接传入JSON对象）
module.exports = { mergeTableColumns, processTableColumnContent };