const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * 从组件名称中提取主组件标识（如“Anchor 锚点”→“Anchor”）
 * @param {string} componentName 页面标题中的组件名，例如 "Button 按钮"
 * @returns {string} 主组件的英文标识，例如 "Button"
 */
function extractMainComponentKey(componentName) {
    // 使用正则表达式匹配开头的英文字母序列
    const match = componentName.match(/^[A-Za-z]+/);
    // 如果匹配到，返回匹配结果，否则移除中文和空格，返回纯英文部分
    return match ? match[0] : componentName.replace(/\s+.*/, '');
}

/**
 * 清理属性名称中的版本号（如"text 2.2.0"→"text"）
 * @param {string} name 属性名称，可能包含版本号信息
 * @returns {string} 清理后的属性名称
 */
function cleanNameWithVersion(name) {
    // 匹配末尾的版本号格式（数字.数字.数字 或 数字.数字）
    // 并将其替换为空字符串，然后去除首尾空格
    return name.replace(/\s+\d+\.\d+(\.\d+)?$/, '').trim();
}

/**
 * 标准化表头名称，将其转换为统一的关键词
 * @param {string} header 原始表头文本，如 "属性名", "类型", "说明"
 * @returns {string} 标准化后的表头关键词，如 "name", "type", "description"
 */
function normalizeHeader(header) {
    const lowerHeader = header.toLowerCase().trim();
    // 检查是否包含关键词，返回相应的标准化名称
    // if (lowerHeader.includes('属性名') || lowerHeader.includes('参数名') || lowerHeader.includes('名称')) {
    if (lowerHeader.includes('属性名') || lowerHeader.includes('参数名') || lowerHeader.includes('名称') || lowerHeader.includes('属性') || lowerHeader.includes('事件名')) {
        return 'name';
    }
    if (lowerHeader.includes('说明') || lowerHeader.includes('描述')) {
        return 'description';
    }
    if (lowerHeader.includes('类型')) {
        return 'type';
    }
    if (lowerHeader.includes('默认值')) {
        return 'default';
    }
    if (lowerHeader.includes('可选值')) {
        return 'options';
    }
    // 对于插槽和暴露的表格，表头可能不统一，需要额外处理
    if (lowerHeader.includes('slot') || lowerHeader.includes('插槽名')) {
        return 'name';
    }
    if (lowerHeader.includes('expose') || lowerHeader.includes('暴露')) {
        return 'name';
    }
    return lowerHeader;
}

/**
 * 从表格标题中提取组件标识
 * @param {string} title 表格标题，如 "Button Attributes" 或 "ButtonGroup Attributes"
 * @param {string} mainComponentKey 主组件标识
 * @returns {string} 提取到的组件标识，如果未找到则返回主组件标识
 */
function getComponentKey(title, mainComponentKey) {
    const cleanTitle = title.replace(/[​\s]+/g, ' ').trim();
    // 匹配标题开头的字母、数字或连字符组成的单词
    const componentMatch = cleanTitle.match(/^([A-Za-z0-9-]+)\s+/);
    // 如果匹配到则返回匹配结果，否则返回 'main'
    const key = componentMatch ? componentMatch[1] : 'main';
    // 将 'main' 映射到主组件标识，否则返回提取到的子组件标识
    return key === 'main' ? mainComponentKey : key;
}

/**
 * 判断表格的API类型（properties, events, slots, methods, exposes, others）
 * @param {string} title 表格标题，如 "Button Attributes"
 * @returns {string} API类型关键词
 */
function getApiType(title) {
    const lowerTitle = title.toLowerCase().trim();
    // 根据标题关键词判断API类型
    if (lowerTitle.includes('attribute') || lowerTitle.includes('属性')) return 'properties';
    if (lowerTitle.includes('event') || lowerTitle.includes('事件')) return 'events';
    if (lowerTitle.includes('slot') || lowerTitle.includes('插槽')) return 'slots';
    if (lowerTitle.includes('method') || lowerTitle.includes('方法')) return 'methods';
    if (lowerTitle.includes('expose') || lowerTitle.includes('暴露')) return 'exposes';
    return 'others';
}

/**
 * 处理爬取到的原始表格数据，将其结构化为所需的JSON格式
 * @param {Array} tables 爬取到的表格原始数据数组
 * @param {string} mainComponentKey 主组件标识
 * @returns {object} 结构化的API信息对象
 */
function processTables(tables, mainComponentKey) {
    const result = {
        components: {},
        others: []
    };

    tables.forEach(table => {
        // 1. 提取组件标识和API类型
        const componentKey = getComponentKey(table.title, mainComponentKey);
        const apiType = getApiType(table.title);

        // 2. 初始化组件API结构（如果不存在）
        if (!result.components[componentKey]) {
            result.components[componentKey] = {
                properties: [],
                events: [],
                slots: [],
                methods: [],
                exposes: [],
                others: []
            };
        }
        const componentApi = result.components[componentKey];

        // 3. 标准化表头并处理行数据
        const headers = table.headers.map(header => normalizeHeader(header));

        // 确保apiType是有效的，否则整个表格数据放入others
        if (!componentApi.hasOwnProperty(apiType)) {
            // 将整个表格对象作为others数据保存
            componentApi.others.push({ category: table.title, ...table.rows });
            return;
        }

        table.rows.forEach((row, rowIndex) => {
            const item = {};
            headers.forEach((header, index) => {
                if (row[index]) {
                    let value = row[index].trim();
                    // 清理属性名称中的版本号
                    if (header === 'name') {
                        value = cleanNameWithVersion(value);
                    }
                    item[header] = value;
                }
            });

            // 如果是enum类型且有枚举值，将提取到的枚举值数组添加到item中
            if (item.type && item.type.includes('enum') && table.enumValues && table.enumValues[rowIndex]) {
                item.enumOptions = table.enumValues[rowIndex];
            }

            // 将处理后的行数据推入正确的API类型数组
            componentApi[apiType].push(item);
        });
    });

    return result;
}

/**
 * 爬取Element Plus组件API信息的主函数
 * @param {string} url 组件文档页面URL
 * @param {number} retries 重试次数，默认为3次
 */
async function crawlElementPlusAPI(url, retries = 3) {
    // 启动一个无头浏览器实例
    const browser = await puppeteer.launch({
        headless: 'new', // 使用新的无头模式
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // 必要的安全参数
        slowMo: 50 // 减慢操作速度，便于观察和调试
    });

    try {
        const page = await browser.newPage();

        // 监听 page.evaluate 中的 console.log 输出，并将其打印到外部控制台
        page.on('console', msg => {
            console.log('PAGE LOG:', msg.text());
        });

        // 拦截不必要的网络请求，加速页面加载
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            // 只允许加载文档、脚本、样式、XHR和fetch请求
            if (['document', 'script', 'stylesheet', 'xhr', 'fetch'].includes(resourceType)) {
                request.continue();
            } else {
                // 阻止其他请求，如图片、字体等
                request.abort();
            }
        });

        console.log(`正在加载页面: ${url}`);
        // 访问目标URL，等待网络空闲
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 在浏览器环境中执行脚本，获取页面数据
        const { componentInfo, tables } = await page.evaluate(async () => {
            // 在 evaluate 内部重新定义必要的辅助函数，因为它们无法从外部作用域访问
            function normalizeHeader(header) {
                const lowerHeader = header.toLowerCase().trim();
                if (lowerHeader.includes('属性名') || lowerHeader.includes('参数名') || lowerHeader.includes('名称') || lowerHeader.includes('属性') || lowerHeader.includes('事件名')) {
                    return 'name';
                }
                if (lowerHeader.includes('说明') || lowerHeader.includes('描述')) {
                    return 'description';
                }
                if (lowerHeader.includes('类型')) {
                    return 'type';
                }
                if (lowerHeader.includes('默认值')) {
                    return 'default';
                }
                if (lowerHeader.includes('可选值')) {
                    return 'options';
                }
                if (lowerHeader.includes('slot') || lowerHeader.includes('插槽名')) {
                    return 'name';
                }
                if (lowerHeader.includes('expose') || lowerHeader.includes('暴露')) {
                    return 'name';
                }
                return lowerHeader;
            }

            // 增加一个通用的延时函数
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            // 提取组件名称
            let name = '未知组件';
            const titleSelectors = ['h1'];
            for (const sel of titleSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    name = el.textContent.replace(/[​]/g, '').trim();
                    break;
                }
            }

            // 提取组件描述
            let description = '';
            const descSelectors = ['h1 + p'];
            for (const sel of descSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    description = el.textContent.trim();
                    break;
                }
            }
            const componentInfo = { name, description };

            // 查找所有可能的表格元素
            // const tableElements = Array.from(document.querySelectorAll('.vp-table, table, .table'));
            const tableElements = Array.from(document.querySelectorAll('.vp-table'));

            // 遍历所有表格并提取数据
            const tables = await Promise.all(tableElements.map(async (table, tableIndex) => {
                let title = '未知表格';
                let prevEl = table.previousElementSibling;
                // 向上查找最近的标题（H2-H5）作为表格标题
                while (prevEl) {
                    if (['H2', 'H3', 'H4', 'H5'].includes(prevEl.tagName)) {
                        title = prevEl.textContent.replace(/[​]/g, '').trim();
                        break;
                    }
                    prevEl = prevEl.previousElementSibling;
                }

                // 提取表头和数据行
                const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th'))
                    .map(th => th.textContent.trim());
                const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'))
                    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
                    .filter(row => row.length > 0);

                // 找到“类型”列的索引
                const typeColumnIndex = headers.findIndex(header => normalizeHeader(header) === 'type');

                const enumValues = {};
                // 如果存在“类型”列
                if (typeColumnIndex !== -1) {
                    const tableRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
                    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
                        const tableRow = tableRows[rowIndex];
                        const row = rows[rowIndex];

                        // 如果该行类型包含“enum”，则尝试提取枚举值
                        if (row && row[typeColumnIndex]?.toLowerCase().includes('enum')) {
                            console.log(`尝试提取枚举值：表格 ${tableIndex}, 行 ${rowIndex}`);

                            const typeCell = tableRow.querySelector(`td:nth-child(${typeColumnIndex + 1})`);
                            if (typeCell) {
                                // 查找并点击枚举值的 tooltip 按钮
                                const iconButton = typeCell.querySelector('button.el-button.el-tooltip__trigger');
                                if (iconButton) {
                                    iconButton.click();
                                    await delay(500); // 增加延时以确保 tooltip 完全弹出

                                    // 查找可见的 tooltip 元素
                                    const tooltips = document.querySelectorAll('.el-popper');
                                    let codeEl;
                                    for(const tooltip of tooltips) {
                                        // 检查 tooltip 是否可见（非隐藏，有高度）
                                        if (tooltip.offsetParent !== null && tooltip.getBoundingClientRect().height > 0) {
                                            codeEl = tooltip.querySelector('.m-1 > code');
                                            if(codeEl) break;
                                        }
                                    }

                                    if (codeEl) {
                                        // 提取并解析枚举值
                                        const enumText = codeEl.textContent.trim();
                                        const parts = enumText.split(' | ');
                                        const parsedValues = parts.map(part => {
                                            let value = part.replace(/'/g, '').trim();
                                            // 移除 (deprecated) 标记
                                            if (value.includes('(deprecated)')) {
                                                value = value.replace(/\(deprecated\)/, '').trim();
                                            }
                                            return value;
                                        });
                                        // 将解析结果保存
                                        enumValues[rowIndex] = parsedValues;
                                        console.log(`提取成功: ${parsedValues}`);
                                    } else {
                                        console.log('未找到code元素');
                                    }

                                    // 模拟点击页面其他地方来关闭 tooltip
                                    document.body.click();
                                    await delay(200);
                                } else {
                                    console.log('未找到枚举按钮');
                                }
                            } else {
                                console.log('未找到类型单元格');
                            }
                        }
                    }
                }

                return { title, headers, rows, enumValues };
            }));

            // 返回提取到的组件信息和所有表格数据
            return { componentInfo, tables };
        });

        // 提取主组件标识
        const mainComponentKey = extractMainComponentKey(componentInfo.name);
        console.log(`识别到主组件标识: ${mainComponentKey}`);

        // 使用自定义函数处理和结构化表格数据
        const apiData = processTables(tables, mainComponentKey);

        // 组合最终结果
        const result = {
            url,
            ...componentInfo,
            ...apiData
        };

        console.log(`成功提取 ${componentInfo.name} 的API信息`);
        return result;

    } catch (error) {
        console.error(`爬取出错: ${error.message}`);
        // 捕获异常，如果还有重试次数，则重试
        if (retries > 0) {
            console.log(`剩余重试次数: ${retries}，正在重试...`);
            await browser.close();
            return crawlElementPlusAPI(url, retries - 1);
        }
        throw error;
    } finally {
        // 无论成功失败，最后都关闭浏览器
        if (browser) {
            await browser.close();
        }
    }
}

// 命令行入口
if (require.main === module) {
    // 从命令行参数中获取URL
    const url = process.argv[2];
    if (!url) {
        console.error('请提供组件URL，示例：node script.js "https://element-plus.org/zh-CN/component/button.html"');
        process.exit(1);
    }

    // 调用主函数并处理结果
    crawlElementPlusAPI(url)
        .then(result => {
            // 生成文件名
            const fileName = `${result.name.replace(/\s+/g, '-').replace(/[​]/g, '').toLowerCase()}-api-new.json`;
            // 将结果写入JSON文件
            fs.writeFileSync(fileName, JSON.stringify(result, null, 2), 'utf8');
            console.log(`结果已保存到 ${fileName}`);
        })
        .catch(err => {
            console.error('爬取失败:', err.message);
            process.exit(1);
        });
}

// 导出主函数，以便在其他模块中调用
module.exports = { crawlElementPlusAPI };