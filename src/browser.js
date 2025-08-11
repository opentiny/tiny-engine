const puppeteer = require('puppeteer');

/**
 * 使用无头浏览器获取网页内容
 * @param {string} url - 目标URL
 * @returns {Promise<string>} - 网页文本内容
 */
async function getPageContent(url) {
  try {
    const browser = await puppeteer.launch({
      headless: "new", // 使用新的无头模式
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // 安全参数
    });
    
    const page = await browser.newPage();
    
    // 设置视口，确保内容完全加载
    await page.setViewport({ width: 1200, height: 800 });
    
    // 导航到目标URL并等待网络稳定
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 提取页面文本内容
    const content = await page.evaluate(() => {
      // 尝试获取页面主体文本
      if (document.body) {
        return document.body.innerText || document.body.textContent || "";
      }
      return "";
    });
    
    // 关闭浏览器
    await browser.close();

    console.log(content)
    
    // 返回前8000个字符（根据需要调整）
    // return content.slice(0, 12000);
    return content;
    
  } catch (error) {
    console.error(`获取网页内容失败: ${error.message}`);
    throw error;
  }
}

getPageContent('https://element-plus.org/zh-CN/component/form.html')

module.exports = { getPageContent };    