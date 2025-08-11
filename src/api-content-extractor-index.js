const { getPageContent } = require('./browser');
const { analyzeApiContent } = require('./openai');
const { readFileSync } = require('fs');
const { join } = require('path');

async function main() {
  try {
    // 从命令行参数获取URL
    const url = process.argv[2];
    
    if (!url) {
      console.error('请提供URL作为参数');
      console.log('使用示例: node src/index.js https://cn.element-plus.org/zh-CN/component/form.html');
      return;
    }
    
    console.log(`正在获取网页内容: ${url}`);
    
    // 1. 使用无头浏览器获取网页内容
    // const pageContent = await getPageContent(url); // 原始
    const pageContent = await getPageContent(url, 'el-icon', '.el-popper.el-tooltip code'); // 增加选择器
    
    console.log(`成功获取网页内容，长度: ${pageContent.length} 字符`);
    

    // 解析URL获取最后一段路径作为文件名（如从https://xxx/form.html提取form.html）
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment); // 分割路径并过滤空字符串
    const fileName = pathSegments.length > 0 
      ? pathSegments[pathSegments.length - 1] + (pathSegments[pathSegments.length - 1].includes('.') ? '' : '.html') 
      : 'index.html'; // 默认文件名
    // 拼接保存路径
    const savePath = join(__dirname, fileName);
    // 写入文件
    const fs = require('fs').promises; // 使用fs.promises异步写入
    try {
      await fs.writeFile(savePath, pageContent, 'utf8');
      console.log(`网页内容已保存到: ${savePath}`);
    } catch (err) {
      console.error(`保存网页内容失败: ${err.message}`);
    }
    
    // 2. 使用OpenAI分析API内容
    console.log('正在使用AI分析API内容...');
    const apiContent = await analyzeApiContent(pageContent, url);
    
    // 3. 输出结果
    console.log('\n--- API分析结果 ---');
    
    // 如果结果是JSON对象，格式化输出
    if (typeof apiContent === 'object') {
      console.log(JSON.stringify(apiContent, null, 2));
    } else {
      // 否则直接输出文本
      console.log(apiContent);
    }
    
    console.log('\n--- 分析完成 ---');
    
  } catch (error) {
    console.error('程序执行出错:', error.message);
    process.exit(1);
  }
}

// 执行主程序
main().catch(console.error);    