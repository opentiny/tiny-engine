const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 将单个子组件的API结果保存到根目录的api-log文件夹
 * @param {object} result 单个子组件的API结果对象
 * @param {string} subComponentName 子组件名（如Button、ButtonGroup）
 */
function saveApiResult(result, subComponentName) {
	try {
		const targetDir = path.join(__dirname, '../api-log');
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}
		// 文件名包含主组件名+子组件名+时间戳，避免重复
		const mainComponentName = result.name || 'unknown-component';
		const timestamp = new Date().getTime();
		const fileName = `${mainComponentName.replace(/\s+/g, '-').replace(/[​]/g, '').toLowerCase()}-${subComponentName.toLowerCase()}-${timestamp}.json`;
		const filePath = path.join(targetDir, fileName);

		fs.writeFileSync(
			filePath,
			JSON.stringify(result, null, 2),
			'utf8'
		);

		console.log(`子组件[${subComponentName}] API结果已保存至: ${filePath}`);
	} catch (error) {
		console.error(`保存子组件[${subComponentName}] API结果失败: ${error.message}`);
	}
}

/**
 * 从组件名称中提取主组件标识（如“Anchor 锚点”→“Anchor”）
 * @param {string} componentName 页面标题中的组件名，例如 "Button 按钮"
 * @returns {string} 主组件的英文标识，例如 "Button"
 */
function extractMainComponentKey(componentName) {
	const match = componentName.match(/^[A-Za-z]+/);
	return match ? match[0] : componentName.replace(/\s+.*/, '');
}

/**
 * 清理属性名称中的版本号（如"text 2.2.0"→"text"）
 * @param {string} name 属性名称，可能包含版本号信息
 * @returns {string} 清理后的属性名称
 */
function cleanNameWithVersion(name) {
	return name.replace(/\s+\d+\.\d+(\.\d+)?$/, '').trim();
}

/**
 * 标准化表头名称，将其转换为统一的关键词
 * @param {string} header 原始表头文本，如 "属性名", "类型", "说明"
 * @returns {string} 标准化后的表头关键词，如 "name", "type", "description"
 */
function normalizeHeader(header) {
	const lowerHeader = header.toLowerCase().trim();
	if (lowerHeader.includes('属性名') || lowerHeader.includes('名称') || lowerHeader.includes('属性')
		|| lowerHeader.includes('事件名') || lowerHeader.includes('插槽名') || lowerHeader.includes('方法名') || lowerHeader.includes('暴露')) {
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
	if (lowerHeader.includes('子标签')) {
		return 'subtag';
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
	if (!cleanTitle) return mainComponentKey;

	const functionKeywords = [
		'api', 'attributes', 'events', 'slots', 'methods',
		'attribute', 'event', 'slot', 'method',
		'属性', '事件', '插槽', '方法'
	];
	const keywordRegex = new RegExp(`^(.*?)\\s+(?=${functionKeywords.join('|')})`, 'i');
	const componentMatch = cleanTitle.match(keywordRegex);

	const key = componentMatch ? componentMatch[1].trim() : mainComponentKey;
	return key || mainComponentKey;
}

/**
 * 判断表格的API类型（properties, events, slots, methods, exposes, others）
 * @param {string} title 表格标题，如 "Button Attributes"
 * @returns {string} API类型关键词
 */
function getApiType(title) {
	const lowerTitle = title.toLowerCase().trim();
	if (lowerTitle.includes('attribute') || lowerTitle.includes('属性') || lowerTitle.includes('配置项')) return 'properties';
	if (lowerTitle.includes('event') || lowerTitle.includes('事件')) return 'events';
	if (lowerTitle.includes('slot') || lowerTitle.includes('插槽')) return 'slots';
	if (lowerTitle.includes('method') || lowerTitle.includes('方法')) return 'methods';
	// if (lowerTitle.includes('expose') || lowerTitle.includes('暴露')) return 'exposes';
	return 'others';
}

/**
 * 处理爬取到的原始表格数据，将其结构化为所需的JSON格式
 * @param {Array} tables 爬取到的表格原始数据数组
 * @param {string} mainComponentKey 主组件标识
 * @returns {object} 结构化的API信息对象（components字段含所有子组件）
 */
function processTables(tables, mainComponentKey) {
	const result = {
		components: {},
		others: []
	};

	// ---------------- 关键修改：先过滤掉跳过的exposes表格 ----------------
	const nonExposesTables = tables.filter(table => !table.isSkipped);
	console.log(`📊 总表格数：${tables.length}，过滤后非exposes表格数：${nonExposesTables.length}`);
	// ---------------------------------------------------------------------

	// tables.forEach((table, tableIndex) => {
	nonExposesTables.forEach((table, tableIndex) => {
		const componentKey = getComponentKey(table.title, mainComponentKey);
		const apiType = getApiType(table.title);

		if (!result.components[componentKey]) {
			result.components[componentKey] = {
				properties: [],
				events: [],
				slots: [],
				methods: [],
				// exposes: [],
				others: []
			};
		}
		const componentApi = result.components[componentKey];

		console.log(`处理表格${tableIndex}: 归属组件=${componentKey}, 类型=${apiType}, 标题=${table.title}`);

		if (!componentApi.hasOwnProperty(apiType)) {
			componentApi.others.push({ category: table.title, ...table.rows });
			return;
		}

		const headers = table.headers.map(header => normalizeHeader(header));
		table.rows.forEach((row, rowIndex) => {
			const item = {};
			headers.forEach((header, index) => {
				if (row[index]) {
					let value = row[index].trim();
					if (header === 'name') {
						value = cleanNameWithVersion(value);
					}
					item[header] = value;
				}
			});

			if (item.type && item.type.includes('enum') && table.enumValues && table.enumValues[rowIndex]) {
				item.enumOptions = table.enumValues[rowIndex];
			}
			if (apiType === 'events' && item.type && item.type.includes('Function') && table.functionParams && table.functionParams[rowIndex]) {
				item.functionParams = table.functionParams[rowIndex];
			}

			componentApi[apiType].push(item);
		});
	});

	return result;
}

/**
 * 爬取Element Plus组件API信息的主函数（返回子组件API对象数组）
 * @param {string} url 组件文档页面URL
 * @param {number} retries 重试次数，默认为3次
 * @returns {Promise<Array>} 子组件API对象数组
 */
async function crawlElementPlusAPI(url, retries = 3) {
	const browser = await puppeteer.launch({
		headless: 'new',
		defaultViewport: { width: 1280, height: 720 },
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
		slowMo: 50
	});

	try {
		const page = await browser.newPage();

		page.on('console', msg => {
			console.log('PAGE LOG:', msg.text());
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

		console.log(`正在加载页面: ${url}`);
		await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

		const { componentInfo, tables } = await page.evaluate(async () => {
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

			// 提取版本号
			let version = 'unknown';
			const versionEl = document.querySelector('span.el-tag__content');
			if (versionEl) {
				const text = versionEl.textContent.replace(/<!--|-->/g, '').trim();
				version = text;
			}

			const componentInfo = { name, description, version };

			// 提取表格数据
			const tableElements = Array.from(document.querySelectorAll('.vp-table'));
			const tables = await Promise.all(tableElements.map(async (table, tableIndex) => {
				let title = '未知表格';
				let prevEl = table.previousElementSibling;
				while (prevEl) {
					if (['H2', 'H3', 'H4', 'H5'].includes(prevEl.tagName)) {
						title = prevEl.textContent.replace(/[​]/g, '').trim();

						// ---------------- 关键修改：识别exposes表格，直接跳过 ----------------
						if (title.toLowerCase().includes('expose') || title.toLowerCase().includes('暴露')) {
							console.log(`🔍 发现exposes表格[${tableIndex}]，直接跳过：${title}`);
							// 返回空数据，且不执行后续表头/行数据提取
							return {
								title: title, // 保留标题便于日志追溯（可选）
								headers: [],
								rows: [],
								enumValues: {},
								functionParams: {},
								isSkipped: true // 新增标记，用于后续结构化阶段过滤
							};
						}

						break;
					}
					prevEl = prevEl.previousElementSibling;
				}

				const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th'))
					.map(th => th.textContent.trim());
				const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'))
					.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()))
					.filter(row => row.length > 0);

				const typeColumnIndex = headers.findIndex(header => normalizeHeader(header) === 'type');
				const enumValues = {};
				const functionParams = {};
				const isEventsTable = title.toLowerCase().includes('event') || title.toLowerCase().includes('事件');

				if (typeColumnIndex !== -1) {
					const tableRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
					for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
						const tableRow = tableRows[rowIndex];
						const row = rows[rowIndex];

						if (row && row[typeColumnIndex]?.toLowerCase().includes('enum')) {
							console.log(`尝试提取枚举值：表格 ${tableIndex}, 行 ${rowIndex}`);
							const typeCell = tableRow.querySelector(`td:nth-child(${typeColumnIndex + 1})`);
							if (typeCell) {
								const iconButton = typeCell.querySelector('button.el-button.el-tooltip__trigger');
								if (iconButton) {
									iconButton.click();
									await delay(1000);

									// 关键优化：1. 获取当前行的位置信息
									const rowRect = tableRow.getBoundingClientRect();
									let codeEl = null;
									let targetTooltip = null;

									// 2. 遍历所有 tooltip，找到与当前行位置重叠的那个
									const tooltips = document.querySelectorAll('.el-popper');
									for (const tooltip of tooltips) {
										if (tooltip.offsetParent === null || tooltip.getBoundingClientRect().height === 0) {
											continue; // 跳过隐藏的 tooltip
										}
										const tooltipRect = tooltip.getBoundingClientRect();
										// 判断 tooltip 是否与当前行在垂直方向重叠（容忍 10px 误差）
										const isOverlapping = !(
											tooltipRect.bottom < rowRect.top - 10 ||
											tooltipRect.top > rowRect.bottom + 10
										);
										if (isOverlapping) {
											targetTooltip = tooltip;
											codeEl = tooltip.querySelector('.m-1 > code');
											break;
										}
									}

									// 3. 提取枚举值（仅用当前行匹配到的 tooltip）
									if (codeEl) {
										const enumText = codeEl.textContent.trim();
										const parts = enumText.split(' | ');
										const parsedValues = parts.map(part => {
											let value = part.replace(/'/g, '').trim();
											if (value.includes('(deprecated)')) {
												value = value.replace(/\(deprecated\)/, '').trim();
											}
											return value;
										});
										enumValues[rowIndex] = parsedValues;
										console.log(`提取成功[表格${tableIndex}-行${rowIndex}]: ${parsedValues}`);
									} else {
										console.log(`未找到当前行的 tooltip[表格${tableIndex}-行${rowIndex}]`);
									}

									// 4. 关闭当前 tooltip
									// document.body.click();
									// await delay(800);
									if (iconButton) {
										iconButton.click(); // 第二次点击：触发弹框关闭（toggle 切换）
										await delay(900); // 等待弹框完全关闭（时间可根据页面性能调整）
									} else {
										// 最终兜底：全局点击空白处（避免弹框残留）
										document.body.click();
										await delay(900);
									}

								} else {
									console.log(`未找到枚举按钮[表格${tableIndex}-行${rowIndex}]`);
								}
							} else {
								console.log('未找到类型单元格');
							}
						} else if (isEventsTable && row && row[typeColumnIndex]?.toLowerCase().includes('function')) {
							console.log(`尝试提取Function参数：表格 ${tableIndex}, 行 ${rowIndex}`);
							const typeCell = tableRow.querySelector(`td:nth-child(${typeColumnIndex + 1})`);
							if (typeCell) {
								const iconButton = typeCell.querySelector('button.el-button.el-tooltip__trigger');
								if (iconButton) {
									// 第一次点击：打开弹框
									iconButton.click();
									await delay(1000); // 等待弹框渲染

									// 匹配当前行的弹框，提取内容（逻辑不变）
									const rowRect = tableRow.getBoundingClientRect();
									let codeEl = null;
									let targetTooltip = null;
									const tooltips = document.querySelectorAll('.el-popper');
									for (const tooltip of tooltips) {
										if (tooltip.offsetParent === null || tooltip.getBoundingClientRect().height === 0) continue;
										const tooltipRect = tooltip.getBoundingClientRect();
										const isOverlapping = !(
											tooltipRect.bottom < rowRect.top - 20 ||
											tooltipRect.top > rowRect.bottom + 20
										);
										if (isOverlapping) {
											targetTooltip = tooltip;
											codeEl = tooltip.querySelector('.m-1 > code') || tooltip.querySelector('code');
											break;
										}
									}

									// 提取弹框内容（逻辑不变）
									if (codeEl) {
										const functionText = codeEl.textContent.trim();
										functionParams[rowIndex] = functionText;
										console.log(`提取成功[表格${tableIndex}-行${rowIndex}]: ${functionText}`);
									} else {
										console.log(`未找到Function参数的code元素[表格${tableIndex}-行${rowIndex}]`);
									}

									if (iconButton) {
										iconButton.click(); // 第二次点击：触发弹框关闭（toggle 切换）
										await delay(900); // 等待弹框完全关闭（时间可根据页面性能调整）
									} else {
										// 最终兜底：全局点击空白处（避免弹框残留）
										document.body.click();
										await delay(900);
									}

								} else {
									console.log(`未找到Function参数的按钮[表格${tableIndex}-行${rowIndex}]`);
								}
							} else {
								console.log(`未找到类型单元格[表格${tableIndex}-行${rowIndex}]`);
							}
						}
					}
				}

				return { title, headers, rows, enumValues, functionParams };
			}));

			return { componentInfo, tables };
		});

		// 处理表格数据，得到含所有子组件的API对象
		const mainComponentKey = extractMainComponentKey(componentInfo.name);
		console.log(`识别到主组件标识: ${mainComponentKey}`);
		const apiData = processTables(tables, mainComponentKey);

		// 核心修改：将单个对象拆分为子组件API对象数组
		const subComponentKeys = Object.keys(apiData.components);
		const subComponentApiArray = subComponentKeys.map(subKey => {
			// 每个子组件对象仅保留当前子组件的信息，继承公共字段
			return {
				url, // 公共字段：原URL
				...componentInfo, // 公共字段：name/description/version
				components: {
					[subKey]: apiData.components[subKey] // 仅保留当前子组件
				},
				others: apiData.others // 公共字段：其他信息
			};
		});

		console.log(`成功提取 ${componentInfo.name} 的API信息，共${subComponentApiArray.length}个子组件`);

		// 保存每个子组件的API结果
		subComponentApiArray.forEach(apiObj => {
			const subKey = Object.keys(apiObj.components)[0]; // 子组件名（如Button、ButtonGroup）
			saveApiResult(apiObj, subKey);
		});

		// console.log('subComponentApiArray:\n', subComponentApiArray)

		return subComponentApiArray; // 返回子组件数组

	} catch (error) {
		console.error(`爬取出错: ${error.message}`);
		if (retries > 0) {
			console.log(`剩余重试次数: ${retries}，正在重试...`);
			await browser.close();
			return crawlElementPlusAPI(url, retries - 1);
		}
		throw error;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

// 命令行入口
if (require.main === module) {
	const url = process.argv[2];
	if (!url) {
		console.error('请提供组件URL，示例：node element-api-crawler.js "https://element-plus.org/zh-CN/component/button.html"');
		process.exit(1);
	}

	crawlElementPlusAPI(url)
		.then(apiArray => {
			console.log(`爬取完成，子组件API数组长度: ${apiArray.length}`);
		})
		.catch(err => {
			console.error('爬取失败:', err.message);
			process.exit(1);
		});
}

module.exports = { crawlElementPlusAPI };