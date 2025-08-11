const { getPageContent } = require('./browser');
const { analyzeApiContent } = require('./openai');
const { join } = require('path');
const fs = require('fs').promises;

/**
 * 从指定URL提取并分析API内容
 * @param {string} url - 要提取API内容的网页URL
 * @param {boolean} [savePageContent=false] - 是否保存获取的网页内容
 * @returns {Promise<object>} 分析后的API内容JSON对象
 */
async function extractApiContent(url, savePageContent = false) {
  try {
    if (!url) {
      throw new Error('必须提供URL参数');
    }
    
    console.log(`正在获取网页内容: ${url}`);
    
    // 使用无头浏览器获取网页内容
    const pageContent = await getPageContent(url, 'el-icon', '.el-popper.el-tooltip code');
    
    console.log(`成功获取网页内容，长度: ${pageContent.length} 字符`);
    
    // 如果需要，保存网页内容
    if (savePageContent) {
      // 解析URL获取最后一段路径作为文件名
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      const fileName = pathSegments.length > 0 
        ? pathSegments[pathSegments.length - 1] + (pathSegments[pathSegments.length - 1].includes('.') ? '' : '.html') 
        : 'index.html';
      const savePath = join(__dirname, fileName);
      
      try {
        await fs.writeFile(savePath, pageContent, 'utf8');
        console.log(`网页内容已保存到: ${savePath}`);
      } catch (err) {
        console.error(`保存网页内容失败: ${err.message}`);
        // 保存失败不中断整个流程
      }
    }
    
    // 使用OpenAI分析API内容
    console.log('正在使用AI分析API内容...');
    const apiContent = await analyzeApiContent(pageContent, url);
    
    // 确保返回的是对象类型
    if (typeof apiContent !== 'object' || apiContent === null) {
      try {
        // 尝试将字符串解析为JSON对象
        return JSON.parse(apiContent);
      } catch (parseError) {
        // 如果解析失败，返回包含原始内容的对象
        return { content: apiContent, parsed: false };
      }
    }
    
    return apiContent;
    
  } catch (error) {
    console.error('API内容提取出错:', error.message);
    throw error; // 抛出错误让调用者处理
  }
}

// 如果直接运行此文件，则作为命令行工具使用
if (require.main === module) {
  const url = process.argv[2];
  
  if (!url) {
    console.error('请提供URL作为参数');
    console.log('使用示例: node api-content-extractor.js https://cn.element-plus.org/zh-CN/component/form.html');
    process.exit(1);
  }
  
  extractApiContent(url, true)
    .then(apiContent => {
      console.log(JSON.stringify(apiContent, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = { extractApiContent };
