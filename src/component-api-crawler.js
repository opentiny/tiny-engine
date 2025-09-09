const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 默认配置 - 用户应根据目标网页修改这些选择器
 * 所有选择器支持CSS选择器语法
 */
const DEFAULT_CONFIG = {
  // 组件基本信息选择器
  basicInfo: {
    name: 'h1',                  // 组件名称选择器
    description: 'h1 + p',       // 组件描述选择器
    version: 'span.el-tag__content', // 版本号选择器
    versionFilter: (text) => text.replace(/<!--|-->/g, '').trim() // 版本号处理函数
  },
  
  // 子组件配置 - 每个子组件对应一组API表格
  components: [
    {
      name: '',                  // 子组件名称(留空则使用主组件名)
      selector: '',              // 子组件容器选择器(留空则表示整个页面)
      
      // 各类API表格的选择器
      tables: {
        properties: '.properties-table',  // 属性表格选择器
        events: '.events-table',          // 事件表格选择器
        slots: '.slots-table',            // 插槽表格选择器
        methods: '.methods-table'         // 方法表格选择器
      },
      
      // 每个表格中字段对应的列索引或表头文本
      // 可以是列索引(从0开始)或表头文本(会自动查找匹配的列)
      fieldMapping: {
        properties: {
          name: 0,           // 属性名所在列
          description: 1,    // 描述所在列
          type: 2,           // 类型所在列
          default: 3         // 默认值所在列
        },
        events: {
          name: 0,           // 事件名所在列
          description: 1,    // 描述所在列
          type: 2,           // 类型所在列
          functionParams: 3  // 函数参数所在列
        },
        slots: {
          name: 0,           // 插槽名所在列
          description: 1     // 描述所在列
        },
        methods: {
          name: 0,           // 方法名所在列
          description: 1,    // 描述所在列
          type: 2,           // 类型所在列
          functionParams: 3  // 函数参数所在列
        }
      }
    }
  ],
  
  // 复杂数据提取配置(枚举值和函数参数)
  complexData: {
    enumTriggerSelector: 'button.el-button.el-tooltip__trigger', // 枚举弹窗触发按钮
    functionTriggerSelector: 'button.el-button.el-tooltip__trigger', // 函数参数弹窗触发按钮
    tooltipSelector: '.el-popper', // 弹窗容器选择器
    codeSelector: '.m-1 > code, code', // 弹窗内代码选择器
    delay: 1000 // 弹窗操作延迟(毫秒)
  },
  
  // 输出配置
  output: {
    dir: 'api-log', // 输出目录
    fileNameFormat: '{component}-{timestamp}.json', // 文件名格式
    jsonSpace: 2 // JSON格式化空格数
  }
};

/**
 * 保存API结果到文件
 */
function saveApiResult(result, config) {
  try {
    const targetDir = path.join(process.cwd(), config.output.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 解析文件名格式
    const componentName = (result.name || 'unknown-component')
      .replace(/\s+/g, '-')
      .replace(/[​]/g, '')
      .toLowerCase();
    const timestamp = new Date().getTime();
    const fileName = config.output.fileNameFormat
      .replace('{component}', componentName)
      .replace('{timestamp}', timestamp);
    const filePath = path.join(targetDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(result, null, config.output.jsonSpace), 'utf8');
    console.log(`✅ 结果已保存至: ${filePath}`);
  } catch (error) {
    console.error(`❌ 保存结果失败: ${error.message}`);
  }
}

/**
 * 从表头文本中查找列索引
 */
function findColumnIndex(headers, targetText) {
  if (typeof targetText === 'number') {
    return targetText; // 如果已经是数字，直接返回作为索引
  }
  
  const lowerTarget = targetText.toLowerCase().trim();
  return headers.findIndex(header => 
    header.toLowerCase().trim().includes(lowerTarget)
  );
}

/**
 * 提取表格数据
 */
async function extractTableData(page, tableSelector, fieldMapping, complexConfig, isEventsOrMethods = false) {
  if (!tableSelector) return [];
  
  const tableExists = await page.$eval(tableSelector, el => !!el).catch(() => false);
  if (!tableExists) return [];

  return await page.evaluate(async (selector, mapping, config, isComplex) => {
    const table = document.querySelector(selector);
    if (!table) return [];
    
    // 提取表头
    const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th'))
      .map(th => th.textContent.trim());
    
    // 提取行数据
    const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'));
    const result = [];
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowData = {};
      const cells = Array.from(row.querySelectorAll('td'));
      
      // 提取基本字段
      Object.entries(mapping).forEach(([field, indexOrText]) => {
        let index = typeof indexOrText === 'number' 
          ? indexOrText 
          : headers.findIndex(h => h.toLowerCase().includes(indexOrText.toLowerCase()));
        
        if (index >= 0 && index < cells.length) {
          rowData[field] = cells[index].textContent.trim();
        }
      });
      
      // 处理复杂数据 - 枚举值和函数参数
      if (isComplex && rowData.type) {
        // 查找类型单元格
        let typeCell = null;
        Object.entries(mapping).forEach(([field, indexOrText]) => {
          if (field === 'type') {
            let index = typeof indexOrText === 'number' 
              ? indexOrText 
              : headers.findIndex(h => h.toLowerCase().includes(indexOrText.toLowerCase()));
            
            if (index >= 0 && index < cells.length) {
              typeCell = cells[index];
            }
          }
        });
        
        if (typeCell) {
          // 处理枚举值
          if (rowData.type.toLowerCase().includes('enum')) {
            const trigger = typeCell.querySelector(config.enumTriggerSelector);
            if (trigger) {
              trigger.click();
              await delay(config.delay);
              
              // 查找对应的弹窗
              const rowRect = row.getBoundingClientRect();
              const tooltips = document.querySelectorAll(config.tooltipSelector);
              const targetTooltip = Array.from(tooltips).find(tooltip => {
                if (!tooltip.offsetParent) return false;
                const tooltipRect = tooltip.getBoundingClientRect();
                return !(tooltipRect.bottom < rowRect.top - 10 || tooltipRect.top > rowRect.bottom + 10);
              });
              
              if (targetTooltip) {
                const codeEl = targetTooltip.querySelector(config.codeSelector);
                if (codeEl) {
                  const enumText = codeEl.textContent.trim();
                  rowData.enumOptions = enumText.split(' | ')
                    .map(v => v.replace(/'/g, '').replace(/\(deprecated\)/, '').trim());
                }
              }
              
              // 关闭弹窗
              trigger.click();
              await delay(config.delay);
            }
          }
          
          // 处理函数参数
          if (rowData.type.toLowerCase().includes('function')) {
            const trigger = typeCell.querySelector(config.functionTriggerSelector);
            if (trigger) {
              trigger.click();
              await delay(config.delay);
              
              // 查找对应的弹窗
              const rowRect = row.getBoundingClientRect();
              const tooltips = document.querySelectorAll(config.tooltipSelector);
              const targetTooltip = Array.from(tooltips).find(tooltip => {
                if (!tooltip.offsetParent) return false;
                const tooltipRect = tooltip.getBoundingClientRect();
                return !(tooltipRect.bottom < rowRect.top - 20 || tooltipRect.top > rowRect.bottom + 20);
              });
              
              if (targetTooltip) {
                const codeEl = targetTooltip.querySelector(config.codeSelector);
                if (codeEl) {
                  rowData.functionParams = codeEl.textContent.trim();
                }
              }
              
              // 关闭弹窗
              trigger.click();
              await delay(config.delay);
            }
          }
        }
      }
      
      result.push(rowData);
    }
    
    return result;
  }, tableSelector, fieldMapping, complexConfig, isEventsOrMethods);
}

/**
 * 通用组件API爬取主函数
 */
async function crawlComponentApi(url, customConfig = {}, retries = 3) {
  // 合并默认配置与用户配置
  const config = { ...DEFAULT_CONFIG };
  Object.keys(customConfig).forEach(key => {
    if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
      config[key] = { ...config[key], ...customConfig[key] };
    } else {
      config[key] = customConfig[key];
    }
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: config.complexData.delay / 2
  });

  try {
    const page = await browser.newPage();

    // 页面日志转发
    page.on('console', msg => console.log('📄 页面日志:', msg.text()));

    // 拦截不必要的请求
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const allowedTypes = ['document', 'script', 'stylesheet', 'xhr', 'fetch'];
      allowedTypes.includes(req.resourceType()) ? req.continue() : req.abort();
    });

    // 加载页面
    console.log(`🌐 加载页面: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // 提取组件基本信息
    const componentInfo = {};
    
    // 提取名称
    componentInfo.name = await page.$eval(
      config.basicInfo.name,
      el => el.textContent.replace(/[​]/g, '').trim()
    ).catch(() => '未知组件');
    
    // 提取描述
    componentInfo.description = await page.$eval(
      config.basicInfo.description,
      el => el.textContent.trim()
    ).catch(() => '');
    
    // 提取版本
    componentInfo.version = await page.$eval(
      config.basicInfo.version,
      (el, filter) => filter(el.textContent),
      config.basicInfo.versionFilter
    ).catch(() => 'unknown');

    // 提取子组件信息
    const components = {};
    
    for (const compConfig of config.components) {
      const componentName = compConfig.name || componentInfo.name;
      console.log(`🔍 提取子组件: ${componentName}`);
      
      // 准备子组件数据结构
      components[componentName] = {
        properties: [],
        events: [],
        slots: [],
        methods: []
      };
      
      // 如果指定了子组件容器，使用它作为查询上下文
      const context = compConfig.selector 
        ? await page.$(compConfig.selector) 
        : page;
      
      if (!context) {
        console.log(`⚠️ 未找到子组件容器: ${compConfig.selector}`);
        continue;
      }
      
      // 提取各类表格数据
      // 属性表格
      if (compConfig.tables.properties) {
        components[componentName].properties = await extractTableData(
          context,
          compConfig.tables.properties,
          compConfig.fieldMapping.properties,
          config.complexData,
          false
        );
        console.log(`📋 提取属性 ${components[componentName].properties.length} 条`);
      }
      
      // 事件表格
      if (compConfig.tables.events) {
        components[componentName].events = await extractTableData(
          context,
          compConfig.tables.events,
          compConfig.fieldMapping.events,
          config.complexData,
          true
        );
        console.log(`📋 提取事件 ${components[componentName].events.length} 条`);
      }
      
      // 插槽表格
      if (compConfig.tables.slots) {
        components[componentName].slots = await extractTableData(
          context,
          compConfig.tables.slots,
          compConfig.fieldMapping.slots,
          config.complexData,
          false
        );
        console.log(`📋 提取插槽 ${components[componentName].slots.length} 条`);
      }
      
      // 方法表格
      if (compConfig.tables.methods) {
        components[componentName].methods = await extractTableData(
          context,
          compConfig.tables.methods,
          compConfig.fieldMapping.methods,
          config.complexData,
          true
        );
        console.log(`📋 提取方法 ${components[componentName].methods.length} 条`);
      }
    }

    // 构建最终结果
    const result = {
      url,
      ...componentInfo,
      components
    };

    // 保存结果
    saveApiResult(result, config);

    console.log(`🎉 爬取完成！共提取 ${Object.keys(components).length} 个子组件`);
    return result;

  } catch (error) {
    console.error(`❌ 爬取出错: ${error.message}`);
    if (retries > 0) {
      console.log(`🔄 剩余重试次数: ${retries}，正在重试...`);
      await browser.close();
      return crawlComponentApi(url, customConfig, retries - 1);
    }
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// 命令行入口
if (require.main === module) {
  const [_, __, url, configPath] = process.argv;

  if (!url) {
    console.error('❌ 请提供目标URL！示例：');
    console.error('node component-api-crawler.js "https://xxx.com/component/button.html" [config.json]');
    process.exit(1);
  }

  // 加载自定义配置文件
  let customConfig = {};
  if (configPath && fs.existsSync(configPath)) {
    try {
      customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`📋 加载自定义配置: ${configPath}`);
    } catch (err) {
      console.error(`❌ 解析配置文件失败: ${err.message}`);
      process.exit(1);
    }
  }

  // 执行爬取
  crawlComponentApi(url, customConfig)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ 爬取最终失败:', err.message);
      process.exit(1);
    });
}

module.exports = { crawlComponentApi, DEFAULT_CONFIG };
