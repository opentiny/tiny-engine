const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ---------------- 1. 数据保存函数 (通用) ----------------

/**
 * 将单个子组件的API结果保存到api-log文件夹
 * @param {object} result 单个子组件的API结果对象
 * @param {string} subComponentName 子组件名
 */
function saveApiResult(result, subComponentName) {
	try {
		const targetDir = path.join(__dirname, './api-log');
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}
		const mainComponentName = result.name.replace(/\s+/g, '-').replace(/[​]/g, '').toLowerCase() || 'unknown-component';
		const timestamp = new Date().getTime();
		const fileName = `${mainComponentName}-${subComponentName.replace(/\s+/g, '-').replace(/[​]/g, '').toLowerCase()}-${timestamp}.json`;
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

// ---------------- 2. 核心爬取函数 ----------------
/**
 * 爬取组件API信息的主函数
 * @param {string} url 组件文档页面URL
 * @param {object} config 包含所有选择器的配置对象
 * @param {number} retries 重试次数，默认为3次
 * @returns {Promise<Array>} 子组件API对象数组
 */
async function extractApiFromUrl(url, config, retries = 3) {
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

		const result = await page.evaluate(async (config) => {

			// 移除名称字符串末尾的数字版本号（支持带v前缀、后缀的版本格式）（如 "scroll 2.9.0"=>"scroll"、"button v1.2.3-beta"=>"button"）
			function removeVersionFromName(name) {
				// 正则匹配版本号模式：空格 + 可选v + 数字.数字.数字 + 可选后缀（如-beta）
				const versionRegex = /\s+v?\d+\.\d+\.\d+[-\w]*/i;
				return name.replace(versionRegex, '').trim();
			}
			function delay(ms) {
				return new Promise(resolve => setTimeout(resolve, ms));
			}

			// 提取基础信息
			let name = '未知组件';
			const nameEl = document.querySelector(config.basicInfo.name);
			if (nameEl) {
				name = nameEl.textContent.replace(/[​]/g, '').trim();
				name = removeVersionFromName(name);
			}

			let description = '';
			const descEl = document.querySelector(config.basicInfo.description);
			if (descEl) {
				description = descEl.textContent.trim();
			}

			let version = 'unknown';
			if (config.basicInfo.version) {
				const versionEl = document.querySelector(config.basicInfo.version);
				if (versionEl) {
					const text = versionEl.textContent.replace(/<!--|-->/g, '').trim();
					version = text;
				}
			}

			const componentInfo = { name, description, version };
			const components = {};

			// 遍历配置文件中的每个组件
			for (const compConfig of config.components) {
				const componentName = compConfig.name;
				components[componentName] = {
					properties: [],
					events: [],
					slots: [],
					methods: []
				};

				// 遍历组件下的每个API类型（properties, events, etc.）
				for (const apiType in compConfig.tables) {
					const tableConfig = compConfig.tables[apiType];
					const tableElement = document.querySelector(tableConfig.selector);

					if (!tableElement) {
						console.log(`未找到[${componentName}]的[${apiType}]表格，选择器: ${tableConfig.selector}`);
						continue;
					}

					console.log(`开始处理组件[${componentName}]的[${apiType}]表格...`);

					const headers = Array.from(tableElement.querySelectorAll(config.commonSelectors.tableHeader))
						.map(th => th.textContent.trim());

					const rows = Array.from(tableElement.querySelectorAll(config.commonSelectors.tableRow));

					for (const rowElement of rows) {
						const rowData = {};
						const tds = Array.from(rowElement.querySelectorAll('td')).map(td => td.textContent.trim());

						// 使用 fieldMapping 将列数据映射到标准化键
						const fieldMapping = tableConfig.fieldMapping;
						for (const key in fieldMapping) {
							const originalHeader = fieldMapping[key];
							const colIndex = headers.indexOf(originalHeader);
							if (colIndex !== -1 && tds[colIndex]) {
								let value = tds[colIndex];
								// 如果是name字段，移除版本号
								if (key === 'name') {
									value = removeVersionFromName(value);
								}
								rowData[key] = value;
							}
						}

						// 处理可选的复杂类型（enum, function）
						if (rowData.type && (rowData.type.toLowerCase().includes('enum') || rowData.type.toLowerCase().includes('function')
							|| rowData.type.toLowerCase().includes('array') || rowData.type.toLowerCase().includes('object'))) {
							const typeCell = rowElement.querySelector(`td:nth-child(${headers.indexOf(fieldMapping.type) + 1})`);
							if (typeCell) {
								const iconButton = typeCell.querySelector(config.tooltipInteraction.triggerButton);
								if (iconButton) {
									iconButton.click();
									await delay(1000);

									const rowRect = rowElement.getBoundingClientRect();
									let codeEl = null;
									const tooltips = document.querySelectorAll(config.tooltipInteraction.tooltipContainer);

									for (const tooltip of tooltips) {
										if (tooltip.offsetParent === null || tooltip.getBoundingClientRect().height === 0) continue;
										const tooltipRect = tooltip.getBoundingClientRect();
										const isOverlapping = !(
											tooltipRect.bottom < rowRect.top - 20 ||
											tooltipRect.top > rowRect.bottom + 20
										);
										if (isOverlapping) {
											codeEl = tooltip.querySelector(config.tooltipInteraction.tooltipContent);
											break;
										}
									}

									if (codeEl) {
										const extractedText = codeEl.textContent.trim();
										if (rowData.type.toLowerCase().includes('enum')) {
											rowData.enumOptions = extractedText.split('|').map(part => part.trim().replace(/'/g, '').replace(/\(deprecated\)/g, '').trim()).filter(Boolean);
										}
										if (rowData.type.toLowerCase().includes('function')) {
											rowData.functionParams = extractedText;
										}
										if (rowData.type.toLowerCase().includes('object')) {
											rowData.objectParams = extractedText;
										}
										if (rowData.type.toLowerCase().includes('array')) {
											rowData.arrayParams = extractedText;
										}
									}

									iconButton.click();
									await delay(900);
								}
							}
						}

						components[componentName][apiType].push(rowData);
					}
				}
			}

			return { componentInfo, components };
		}, config);

		const finalResult = {
			url,
			...result.componentInfo,
			components: result.components
		};

		// 将单个对象拆分为子组件API对象数组并保存
		const subComponentApiArray = Object.keys(finalResult.components).map(subKey => {
			return {
				url: finalResult.url,
				name: finalResult.name,
				description: finalResult.description,
				version: finalResult.version,
				components: {
					[subKey]: finalResult.components[subKey]
				}
			};
		});

		console.log(`成功提取 ${finalResult.name} 的API信息，共${subComponentApiArray.length}个子组件`);
		// subComponentApiArray.forEach(apiObj => {
		// 	const subKey = Object.keys(apiObj.components)[0];
		// 	saveApiResult(apiObj, subKey);
		// });

		return subComponentApiArray;

	} catch (error) {
		console.error(`爬取出错: ${error.message}`);
		if (retries > 0) {
			console.log(`剩余重试次数: ${retries}，正在重试...`);
			await browser.close();
			return extractApiFromUrl(url, config, retries - 1);
		}
		throw error;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

// ---------------- 3. 命令行入口 (通用化) ----------------

if (require.main === module) {
	const [url, configPath] = process.argv.slice(2);
	if (!url || !configPath) {
		console.error('请提供组件URL和配置文件路径，示例：');
		console.error('node web-based-api-generator.js "https://element-plus.org/zh-CN/component/button" "./refined-element-plus-config.json"');
		process.exit(1);
	}

	try {
		const config = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));
		extractApiFromUrl(url, config)
			.then(apiArray => {
				console.log(`爬取完成，子组件API数组长度: ${apiArray.length}`);
			})
			.catch(err => {
				console.error('爬取失败:', err.message);
				process.exit(1);
			});
	} catch (error) {
		console.error('读取或解析配置文件失败:', error.message);
		process.exit(1);
	}
}

module.exports = { extractApiFromUrl };