const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config({
	path: path.resolve(__dirname, '../../.env')
});

// 初始化OpenAI客户端
const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY || "",
	baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
	timeout: 600000, // 10分钟超时
});

// ---------------- 核心工具函数 ----------------
/**
 * 从页面标题提取组件名（如"Button 按钮 | Element Plus" → "Button 按钮"）
 * @param {string} pageTitle 页面原始标题
 * @returns {string} 清理后的组件名
 */
function extractComponentName(pageTitle) {
	if (!pageTitle) return '未知组件';
	// 匹配"组件名 说明 | 框架名"格式，提取前半部分
	const titleRegex = /^([^|]+)/;
	const match = pageTitle.match(titleRegex);
	return match ? match[1].trim() : pageTitle.trim();
}

/**
 * 清理大模型返回结果（去除代码块标记、多余空格）
 * @param {string} responseText 大模型原始返回
 * @returns {string} 清理后的JSON字符串
 */
function cleanModelResponse(responseText, { signal } = {}) {
	if (signal?.aborted) throw new Error('任务被用户取消，停止JSON解析');

	if (typeof responseText !== 'string' || responseText.trim() === '') {
		throw new Error('大模型返回内容为空或非字符串');
	}

	let cleanContent = responseText.trim();

	// 移除代码块标记（支持 ```json、``` 等格式）
	const codeBlockRegex = /^```(json|javascript|js|)\s*([\s\S]*?)\s*```$/i;
	const codeBlockMatch = cleanContent.match(codeBlockRegex);

	// 如果匹配到代码块，提取内部的JSON内容
	if (codeBlockMatch && codeBlockMatch[2]) {
		cleanContent = codeBlockMatch[2].trim();
	}

	// 校验JSON格式
	try {
		JSON.parse(cleanContent);
	} catch (parseError) {
		throw new Error(`提取的JSON存在语法错误：${parseError.message}\n错误JSON内容：${cleanContent.slice(0, 200)}...`);
	}

	return cleanContent;
}

// ---------------- 拆分函数 1: 爬取原始表格数据 ----------------

/**
 * 爬取网页并提取所有匹配选择器的表格数据和页面标题。
 * @param {string} url 目标页面URL
 * @param {string} tableSelector 表格DOM选择器
 * @param {number} retries 重试次数
 * @returns {Promise<{pageTitle: string, tablesData: Array}>} 
 */
async function scrapeRawTables(url, tableSelector, retries, { signal } = {}) {
	let browser = null;

	// 注册中断监听，关闭浏览器
	const abortHandler = async () => {
		console.log(`[爬取中断] 正在关闭浏览器（URL：${url}）`);
		if (browser) await browser.close().catch(e => console.warn(`关闭浏览器失败：${e.message}`));
	};
	signal?.addEventListener('abort', abortHandler);

	try {
		if (signal?.aborted) throw new Error('任务被用户取消');

		browser = await puppeteer.launch({
			headless: 'new',
			defaultViewport: { width: 1280, height: 720 },
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			slowMo: 30
		});

		const page = await browser.newPage();

		// 监听/过滤资源 (省略日志监听和请求拦截，与原始代码保持一致)
		page.on('console', msg => {
			if (['log', 'info', 'error'].includes(msg.type())) {
				console.log(`[PAGE LOG ${msg.type().toUpperCase()}] ${msg.text()}`);
			}
		});

		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const resourceType = request.resourceType();
			if (['document', 'script', 'stylesheet', 'xhr', 'fetch'].includes(resourceType)) {
				request.continue();
			} else {
				request.abort();
			}
		});

		// 加载页面
		console.log(`[开始] 加载页面: ${url}`);
		try {
			const gotoPromise = page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

			if (signal) {
				await Promise.race([
					gotoPromise,
					new Promise((_, reject) => {
						if (signal.aborted) reject(new Error('任务被用户取消'));
						signal.addEventListener('abort', () => reject(new Error('任务被用户取消')), { once: true });
					})
				]);
			} else {
				await gotoPromise;
			}
		} catch (err) {
			if (signal?.aborted) throw new Error('任务被用户取消');
			throw new Error(`页面加载失败：${err.message}（URL：${url}）`);
		}

		if (signal?.aborted) throw new Error('任务被用户取消');

		// 校验表格选择器
		const hasTable = await page.evaluate((selector) => {
			return document.querySelectorAll(selector).length > 0;
		}, tableSelector);

		if (!hasTable) {
			throw new Error(`未找到匹配的表格，请检查选择器。选择器：${tableSelector}，URL：${url}`);
		}

		// 提取页面标题
		const pageTitle = await page.title();

		// 提取表格数据（含同级前置标题）
		console.log(`[开始] 提取表格数据...`);
		const tablesData = await page.evaluate((selector) => {
			const commonSelectors = {
				tableHeader: 'thead th, tr:first-child th',
				tableRow: 'tbody tr, tr:not(:first-child)',
				titleTagNames: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
			};

			// 提取元素自身直接文本（忽略子元素）
			function getElementDirectText(el) {
				let text = '';
				if (el.nodeType === Node.ELEMENT_NODE) {
					for (let child of el.childNodes) {
						if (child.nodeType === Node.TEXT_NODE) {
							text += child.textContent;
						}
					}
				}
				return text.trim().replace(/\s+/g, ' ');
			}

			// 查找表格同级前置标题
			function findClosestSiblingPreTitle(tableEl) {
				let currentSibling = tableEl.previousElementSibling;
				while (currentSibling) {
					const tagName = currentSibling.tagName;
					if (commonSelectors.titleTagNames.includes(tagName)) {
						return getElementDirectText(currentSibling);
					}
					currentSibling = currentSibling.previousElementSibling;
				}
				return '未找到同级前置标题';
			}

			// 提取单个表格数据
			function extractSingleTable(tableEl, index) {
				const tableTitle = findClosestSiblingPreTitle(tableEl);
				const headers = Array.from(tableEl.querySelectorAll(commonSelectors.tableHeader))
					.map(th => th.textContent.trim().replace(/\s+/g, ' '));
				const rows = Array.from(tableEl.querySelectorAll(commonSelectors.tableRow))
					.map(row => Array.from(row.querySelectorAll('td'))
						.map(td => td.textContent.trim().replace(/\s+/g, ' '))
					)
					.filter(row => row.length > 0);

				return {
					tableIndex: index + 1,
					tableTitle: tableTitle,
					headers: headers,
					rows: rows,
					rowCount: rows.length
				};
			}

			const tableElements = document.querySelectorAll(selector);
			return Array.from(tableElements).map((tableEl, index) => extractSingleTable(tableEl, index));
		}, tableSelector);

		console.log(`[成功] 表格提取完成，共${tablesData.length}个表格`);

		return { pageTitle, tablesData };

	} catch (error) {
		// 仅重新抛出错误，重试逻辑放在整合函数中处理
		throw error;
	} finally {
		signal?.removeEventListener('abort', abortHandler); // 清理监听
		if (browser) {
			await browser.close();
			console.log(`[结束] 浏览器已关闭`);
		}
	}
}


// ---------------- 拆分函数 2: LLM转换逻辑 ----------------

/**
 * 调用大模型将原始表格数据转换为标准API JSON。
 * @param {Array} tablesData 爬取的表格数据数组
 * @param {string} pageTitle 页面原始标题
 * @returns {Promise<Array>} 大模型生成的API JSON数组
 */
async function convertTablesToApiJson(tablesData, pageTitle, { signal } = {}) {
	// 构造大模型输入：表格数据→清晰文本描述
	console.log(`[开始] 构造大模型输入...`);
	const tableContentStr = tablesData.map(table => {
		return `### 表格${table.tableIndex}：${table.tableTitle}
表头：${table.headers.join(' | ')}
数据行：
${table.rows.map((row, i) => `行${i + 1}：${row.join(' | ')}`).join('\n')}
`;
	}).join('\n---\n');

	// 3. 定义大模型Prompt（内容与原代码保持一致）
	const promptMessages = [
		{
			role: "system",
			content: `你是UI组件表格分析专家，需基于网页爬取的表格数据，精准识别每个**独立组件**（如Button和ButtonGroup是两个完全独立的组件），并为每个组件生成独立的JSON对象，确保不同组件不被合并。`
		},
		{
			role: "user",
			content: `请基于以下爬取的组件表格数据，按规则生成标准API JSON数组：

### 一、核心目标
1. 精准识别所有**独立组件**（必须严格分离！例如：
   - "Button"和"ButtonGroup"是两个独立组件；
   - "Table"和"TableColumn"是两个独立组件；
   - "Select"和"SelectOption"是两个独立组件）；
2. 每个独立组件生成一个单独的JSON对象（禁止将TableColumn嵌套在Table内部）；
3. 精准识别每个组件对应的API类型（属性/事件/插槽/方法/暴露）；
4. 所有组件JSON对象共同组成一个数组（即使只有1个组件）。

### 二、API类型智能识别规则（按优先级执行）
#### 优先级1：从表格标题提取明确/隐含的API类型
- 若标题含**明确类型关键词**（中英文均可），直接映射：
- 含“属性”“Props”“Property”→\`properties\`
- 含“事件”“Events”“Event”→\`events\`
- 含“插槽”“Slots”“Slot”→\`slots\`
- 含“方法”“Methods”“Method”→\`methods\`
- 含“暴露”“Exposes”“Expose”→\`exposes\`
- 若标题含**隐含类型关键词**，间接映射：
- 含“Props”“Attributes”→\`properties\`
- 含“Callbacks”“Listeners”→\`events\`
- 含“Slots”“Content”→\`slots\`
- 含“Methods”“Functions”→\`methods\`

#### 优先级2：从表格表头字段推断API类型
若标题无类型信息，通过表头关键词判断：
- 表头含“属性名”“参数名”“类型”“默认值”→\`properties\`
- 表头含“事件名”“触发时机”“回调参数”→\`events\`
- 表头含“插槽名”“插槽内容”“子标签”→\`slots\`
- 表头含“方法名”“函数名”“返回值”→\`methods\`
- 表头含“暴露名”“对外方法”“实例方法”→\`exposes\`

#### 优先级3：从表格数据内容特征推断API类型
若表头无明确标识，通过数据内容特征判断：
- 数据含“string/number/boolean/enum”等类型值、“默认值”→\`properties\`
- 数据含“() => void”“(value) => {}”等函数回调→\`events\`/\`methods\`（事件侧重“触发时机”，方法侧重“主动调用”）
- 数据含“default”“header”“footer”等命名、“自定义内容”描述→\`slots\`
- 数据含“组件实例调用”“对外暴露”等描述→\`exposes\`

#### 优先级4：兜底推断（基于通用UI组件常识）
若以上均无法识别，按以下规则兜底：
- 含“name”“type”“default”字段的表格→\`properties\`
- 含“event”“on”前缀（如onClick）的表格→\`events\`
- 含“slot”后缀的表格→\`slots\`
- 含“func”“method”关键词的表格→\`methods\`
- 未识别的表格→忽略（不生成对应字段）

### 三、独立组件识别规则
【独立组件判断】：符合以下任一条件视为不同组件：
 - 若表格标题含不同组件名（如"Table 属性"、"TableColumn 属性"），则提取为两个独立组件："Table"和"TableColumn"；
 - 若表头/数据中明确出现多个组件名（如同时有"Table"和"TableColumn"的API），则提取为两个独立组件；
 - 组件名存在明显层级或功能差异（如"Table"和"TableColumn"、"Select"和"SelectOption"），则提取为两个独立组件。

### 四、每个独立组件的JSON格式要求（严格遵循）
每个独立组件必须生成包含以下字段的完整JSON对象，**无对应内容时严格按规则填充空值**：

1. 【顶层\`name\`字段】：格式为“组件名 + 中文名称”，从页面标题提取（如页面标题“Button 按钮 | Element Plus”→“Button 按钮”）；
2. 【顶层\`description\`字段】：组件功能描述，根据输入的信息自动识别组件的通用功能描述（如"徽章组件，用于显示通知数量或状态标记"）；禁止填空字符串。
3. 【组件变量名（\`components\`内键名）】：**独立组件的名称**，规则如下：
 - 若表格标题含“组件名+说明”（如“Button 按钮属性”）→提取“Button”；
 - 若表格标题仅含组件名（如“Button”“Table”）→直接使用该名称；
 - 若表格标题含多余修饰词（如“ElButton组件详情”）→提取核心名称“ElButton”；
 - 若多个表格标题指向同一组件（如“Button属性”“Button事件”）→统一使用同一组件名（如“Button”）；
 - 提取原则：去冗余、保留核心标识（可包含组件库前缀，如“ElButton”“AButton”）。


#### 整体结构（每个独立组件为数组的一个元素）
每个独立组件均对应一个**JSON对象**，结构如下：
{
	"name": "处理后组件名+中文名称",  // 如"Button 按钮"
	"description": "组件功能描述",   // 基于表格内容生成通用描述，非空
	"components": {                 // 存放组件API
		"处理后组件变量名": {         // 如"Button"
			"properties": [],           // 属性列表（无则空数组）
			"events": [],               // 事件列表（无则空数组）
			"slots": [],                // 插槽列表（无则空数组）
			"methods": [],              // 方法列表（无则空数组）
			"exposes": []               // 暴露列表（无则空数组）
		}
	}
}


#### \`组件变量名\`对象的各子字段详细规范
根据输入的组件api信息智能识别并填写以下字段：

##### 1. properties（属性列表）
每个属性对象包含：
- \`name\`：属性名
- \`description\`：描述
- \`type\`：类型（多个类型用"|"分隔，无则"unknown"）
- \`default\`：默认值（无则null）
- \`enumOptions\`：枚举值（仅当type为"enum"时，列举枚举值，如"enum: primary/success"→["primary","success"]，否则空数组）

##### 2. events（事件列表）
每个事件对象包含：
- \`name\`：事件名
- \`description\`：描述（无则空字符串）
- \`functionParams\`：参数描述（无则""）

##### 3. slots（插槽列表）
每个插槽对象包含：
- \`name\`：插槽名（默认插槽填"default"）
- \`description\`：描述（无则空字符串）
- \`props\`：接收参数（无则空字符串）

##### 4. methods/exposes（方法/暴露列表）
每个对象包含：
- \`name\`：方法/暴露名
- \`description\`：描述（无则空字符串）
- \`functionParams\`：参数描述（无则""）


### 五、输出格式要求
1. 最终仅返回**JSON数组**，数组的每个元素对应一个独立组件的JSON对象；
2. 若识别到N个独立组件，数组长度必须为N（即使组件功能相关，如Button和ButtonGroup）；
3. 不同组件必须作为数组的独立元素，禁止在同一个\`components\`中包含多个组件；
4. 输出前请自我校验：是否所有独立组件都已分离为数组元素？是否存在组件嵌套（如A组件的components内包含B组件）？若有则立即修正；
5. 输出格式：仅返回纯 JSON 数组，不包含任何多余内容（如解释、注释、json代码块标记）；
6. 禁止在JSON前后添加任何文字，直接以 [ 开头、 ] 结尾；
7. 确保JSON格式标准，键名用双引号，逗号分隔正确。



### 爬取的表格数据
${tableContentStr}

### 页面标题（用于生成组件名）
${pageTitle}
`
		}
	];


	// 4. 调用大模型生成API JSON
	console.log(`[开始] 调用大模型转换表格数据...`);
	try {
		const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // 推荐使用支持JSON的模型
		const completion = await client.chat.completions.create({
			model: model,
			messages: promptMessages,
			temperature: 0.1, // 低温度确保格式准确
			max_tokens: 65536, // 足够长度容纳API结构
			signal
		});

		if (signal?.aborted) throw new Error('任务被用户取消');

		// 清理并解析大模型返回
		const rawResponse = completion.choices[0].message.content.trim();
		const cleanedResponse = cleanModelResponse(rawResponse, { signal });
		let apiJsonArray = JSON.parse(cleanedResponse);

		// 验证返回结果必须是数组
		if (!Array.isArray(apiJsonArray)) {
			throw new Error(`大模型返回格式错误：期望JSON数组，实际收到${typeof apiJsonArray}`);
		}

		console.log(`[成功] 大模型转换完成，生成${apiJsonArray.length}个组件API`);
		return apiJsonArray;

	} catch (error) {
		throw new Error(`大模型转换失败：${error.message}`);
	}
}


// ---------------- 整合函数: 爬取 + 转换 + 重试 ----------------

/**
 * 整合爬取和LLM转换逻辑，并处理重试机制。
 * @param {string} url 目标页面URL
 * @param {string} tableSelector 表格DOM选择器
 * @param {Object} options 选项参数
 * @param {number} options.initialRetries 初始重试次数（默认3次）
 * @param {AbortSignal} options.signal 中断信号
* @returns {Promise<Array<object>>} API JSON数组（每个元素为一个组件的API信息）
 * @throws {Error} 爬取/转换失败时抛出错误
 */
async function extractApiFromUrl(url, tableSelector, { initialRetries = 3, signal } = {}) {
	// 添加中断监听
	if (signal?.aborted) throw new Error('任务已取消');
	const abortHandler = () => {
		console.log(`[URL: ${url}] 收到中断信号，终止流程`);
	};
	signal?.addEventListener('abort', abortHandler);

	try {
		for (let retries = initialRetries; retries >= 0; retries--) {
			// 关键节点1：重试前检查中断
			if (signal?.aborted) throw new Error('任务被用户取消');
			try {
				// 1. 爬取原始数据
				const { pageTitle, tablesData } = await scrapeRawTables(url, tableSelector, retries, { signal });

				// 关键节点2：爬取后检查中断
				if (signal?.aborted) throw new Error('任务被用户取消');
				// 2. LLM转换
				const apiJson = await convertTablesToApiJson(tablesData, pageTitle, { signal });

				// 关键节点3：转换后检查中断
				if (signal?.aborted) throw new Error('任务被用户取消');
				// 3. 构造最终返回结果
				return apiJson // 大模型生成的标准API JSON;

			} catch (error) {
				const errorMsg = error.message;
				// 捕获中断错误
				if (errorMsg.includes('取消')) throw error;
				// 如果是LLM错误或非爬取错误，则直接抛出
				if (errorMsg.includes('大模型') || retries === 0) {
					throw new Error(`[失败] ${errorMsg}`);
				}

				// 如果是爬取错误，且还有重试次数
				console.log(`[重试] 错误：${errorMsg}，剩余次数：${retries}，正在重试...`);
				// 注意：scrapeRawTables 内部已处理浏览器关闭，此处仅需等待后继续循环
				await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
			}
		}
	} finally {
		// 移除事件监听，避免内存泄漏
		signal?.removeEventListener('abort', abortHandler);
	}
}

// ---------------- 命令行入口 ----------------
if (require.main === module) {
	// 检查环境变量（大模型密钥必填）
	if (!process.env.OPENAI_API_KEY) {
		console.error('❌ 缺少环境变量：请设置 OPENAI_API_KEY（大模型密钥）');
		process.exit(1);
	}

	const [url, tableSelector] = process.argv.slice(2);
	if (!url || !tableSelector) {
		console.error('❌ 参数缺失！使用示例：');
		console.error('node generic-api-crawler.js "https://element-plus.org/zh-CN/component/button" ".vp-table"');
		process.exit(1);
	}

	// 执行爬取+转换（处理并按组件拆分保存）
	extractApiFromUrl(url, tableSelector)
		.then(apiJson => {
			console.log('\n[最终结果] 爬取+转换成功！');
			console.log(`共生成 ${apiJson.length} 个组件API`);

			// 保存每个组件为单独的JSON文件
			const logDir = path.join(__dirname, './scraper-api-logs');
			if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

			// 遍历API JSON数组
			apiJson.forEach((component, index) => {
				// 提取组件名作为文件名（处理特殊字符）
				const componentName = component.name
					? component.name.replace(/\s+/g, '-').replace(/[<>:"/\\|?*]/g, '').toLowerCase()
					: `component-${index}`;

				// 生成唯一文件名（组件名+时间戳）
				const timestamp = Date.now();
				const fileName = `${componentName}-${timestamp}.json`;

				// 保存单个组件JSON
				fs.writeFileSync(
					path.join(logDir, fileName),
					JSON.stringify(component, null, 2),
					'utf8'
				);
				console.log(`📄 已保存组件：${path.join(logDir, fileName)}`);
			});

			console.log(`\n✅ 所有组件已保存，共 ${apiJson.length} 个文件`);
		})
		.catch(err => {
			console.error('\n❌ 执行失败：', err.message);
			process.exit(1);
		});
}


// 最终暴露的接口
module.exports = { extractApiFromUrl };