const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * 从组件名称中提取主组件标识（如“Anchor 锚点”→“Anchor”）
 * @param {string} componentName 页面标题中的组件名
 * @returns 主组件标识
 */
function extractMainComponentKey(componentName) {
    const match = componentName.match(/^[A-Za-z]+/);
    return match ? match[0] : componentName.replace(/\s+.*/, '');
}

/**
 * 清理属性名称中的版本号（如"text 2.2.0"→"text"）
 * @param {string} name 属性名称
 * @returns 清理后的属性名称
 */
function cleanNameWithVersion(name) {
    // 匹配末尾的版本号格式（数字.数字.数字 或 数字.数字）
    return name.replace(/\s+\d+\.\d+(\.\d+)?$/, '').trim();
}

/**
 * 标准化表头名称
 * @param {string} header 原始表头文本
 * @returns 标准化后的表头关键词
 */
function normalizeHeader(header) {
    const lowerHeader = header.toLowerCase().trim();
    if (lowerHeader.includes('属性名') || lowerHeader.includes('参数名') || 
        lowerHeader.includes('slot') || lowerHeader.includes('插槽名')) {
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
    return lowerHeader;
}

/**
 * 从表格标题中提取组件标识
 * @param {string} title 表格标题
 * @returns 组件标识
 */
function getComponentKey(title) {
    const cleanTitle = title.replace(/[​\s]+/g, ' ').trim();
    const componentMatch = cleanTitle.match(/^([A-Za-z0-9\u4e00-\u9fa5-]+)\s+/);
    return componentMatch ? componentMatch[1] : 'main';
}

/**
 * 判断表格的API类型
 * @param {string} title 表格标题
 * @returns API类型关键词
 */
function getApiType(title) {
    const lowerTitle = title.toLowerCase().trim();
    if (lowerTitle.includes('attribute') || lowerTitle.includes('属性')) return 'properties';
    if (lowerTitle.includes('event') || lowerTitle.includes('事件')) return 'events';
    if (lowerTitle.includes('slot') || lowerTitle.includes('插槽')) return 'slots';
    if (lowerTitle.includes('method') || lowerTitle.includes('方法')) return 'methods';
    if (lowerTitle.includes('expose') || lowerTitle.includes('暴露')) return 'exposes';
    return 'others';
}

/**
 * 处理表格数据（将main映射到主组件，清理版本号）
 * @param {Array} tables 表格数据数组
 * @param {string} mainComponentKey 主组件标识
 * @returns 结构化的API信息
 */
function processTables(tables, mainComponentKey) {
    const result = {
        components: {},
        others: []
    };

    tables.forEach(table => {
        // 1. 提取并映射组件标识
        let componentKey = getComponentKey(table.title);
        if (componentKey === 'main') {
            componentKey = mainComponentKey;
        }

        // 2. 确定API类型
        const apiType = getApiType(table.title);

        // 3. 初始化组件API结构
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

        // 4. 标准化表头并处理行数据
        const headers = table.headers.map(header => normalizeHeader(header));
        table.rows.forEach(row => {
            const item = {};
            headers.forEach((header, index) => {
                if (row[index]) {
                    let value = row[index].trim();
                    // 若当前字段是名称且存在版本号，则清理
                    if (header === 'name') {
                        value = cleanNameWithVersion(value);
                    }
                    item[header] = value;
                }
            });

            if (apiType === 'others') {
                componentApi.others.push({ category: table.title, ...item });
            } else {
                componentApi[apiType].push(item);
            }
        });
    });

    return result;
}

/**
 * 爬取Element Plus组件API信息
 * @param {string} url 组件文档页面URL
 * @param {number} retries 重试次数
 */
async function crawlElementPlusAPI(url, retries = 3) {
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: 100
    });

    try {
        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['document', 'script', 'stylesheet', 'xhr', 'fetch'].includes(resourceType)) {
                request.continue();
            } else {
                request.abort();
            }
        });

        console.log(`正在加载页面: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 等待页面加载
        const selectorsToTry = ['.vp-doc', '.content', 'main', 'body'];
        let contentLoaded = false;
        for (const selector of selectorsToTry) {
            try {
                await page.waitForSelector(selector, { timeout: 20000 });
                contentLoaded = true;
                break;
            } catch (e) {
                console.log(`选择器 ${selector} 未找到，尝试下一个`);
            }
        }
        if (!contentLoaded) {
            throw new Error('页面加载失败');
        }

        // 提取组件基本信息
        const componentInfo = await page.evaluate(() => {
            let name = '未知组件';
            const titleSelectors = ['h1', '.title', 'header h1'];
            for (const sel of titleSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    name = el.textContent.replace(/[​]/g, '').trim();
                    break;
                }
            }

            let description = '';
            const descSelectors = ['h1 + p', '.description', '.intro'];
            for (const sel of descSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    description = el.textContent.trim();
                    break;
                }
            }

            return { name, description };
        });

        // 提取主组件标识
        const mainComponentKey = extractMainComponentKey(componentInfo.name);
        console.log(`识别到主组件标识: ${mainComponentKey}`);

        // 提取表格数据
        const tables = await page.evaluate(() => {
            const tableSelectors = ['.vp-table', 'table', '.table'];
            let tableElements = [];
            for (const sel of tableSelectors) {
                const elements = document.querySelectorAll(sel);
                if (elements.length > 0) {
                    tableElements = Array.from(elements);
                    break;
                }
            }

            return tableElements.map(table => {
                let title = '未知表格';
                let prevEl = table.previousElementSibling;
                while (prevEl) {
                    if (['H2', 'H3', 'H4', 'H5'].includes(prevEl.tagName)) {
                        title = prevEl.textContent.replace(/[​]/g, '').trim();
                        break;
                    }
                    prevEl = prevEl.previousElementSibling;
                }

                const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th'))
                    .map(th => th.textContent.trim());
                const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'))
                    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
                    .filter(row => row.length > 0);

                return { title, headers, rows };
            }).filter(table => table.rows.length > 0);
        });

        // 处理表格数据
        const apiData = processTables(tables, mainComponentKey);

        // 组合最终结果（移除crawledAt）
        const result = {
            url,
            ...componentInfo,
            ...apiData
        };

        console.log(`成功提取 ${componentInfo.name} 的API信息`);
        return result;

    } catch (error) {
        console.error(`爬取出错: ${error.message}`);
        if (retries > 0) {
            console.log(`剩余重试次数: ${retries}，正在重试...`);
            await browser.close();
            return crawlElementPlusAPI(url, retries - 1);
        }
        throw error;
    } finally {
        await browser.close();
    }
}

// 命令行入口
if (require.main === module) {
    const url = process.argv[2];
    if (!url) {
        console.error('请提供组件URL，示例：node script.js "https://element-plus.org/zh-CN/component/button.html"');
        process.exit(1);
    }

    crawlElementPlusAPI(url)
        .then(result => {
            const fileName = `${result.name.replace(/\s+/g, '-').replace(/[​]/g, '').toLowerCase()}-api.json`;
            fs.writeFileSync(fileName, JSON.stringify(result, null, 2), 'utf8');
            console.log(`结果已保存到 ${fileName}`);
        })
        .catch(err => {
            console.error('爬取失败:', err.message);
            process.exit(1);
        });
}

module.exports = { crawlElementPlusAPI };
