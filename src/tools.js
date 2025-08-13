const { Tool } = require("@langchain/core/tools");
const { crawlElementPlusAPI } = require("./element-api-crawler");
const { convertToTinyEngineSchema } = require("./convertor"); // 假设转换函数在该文件中

/**
 * Element Plus API爬虫工具
 */
class ElementApiCrawlerTool extends Tool {
  name = "element_api_crawler";

  description = `
  用于爬取Element Plus组件库的API文档信息。
  输入：Element Plus组件文档的URL（如"https://element-plus.org/zh-CN/component/button.html"）
  输出：包含组件名称、描述、属性、事件、插槽等信息的JSON字符串
  当需要获取组件原始API数据时使用此工具。
  `;

  async _call(input) {
    try {
      if (!input.startsWith('http')) {
        return "错误：请提供有效的Element Plus组件文档URL";
      }
      
      const result = await crawlElementPlusAPI(input);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `爬取失败：${error.message}`;
    }
  }
}

/**
 * TinyEngine Schema转换工具
 */
class TinyEngineConverterTool extends Tool {
  name = "tiny_engine_converter";

  description = `
  用于将组件API信息转换为符合tinyEngine组件协议的schema。
  输入：由element_api_crawler工具返回的JSON字符串
  输出：符合tinyEngine协议的完整JSON schema
  必须先使用element_api_crawler获取API数据后，才能使用此工具进行转换。
  `;

  async _call(input) {
    try {
      // 解析爬虫返回的JSON数据
      const apiContent = JSON.parse(input);
      // 调用转换函数
      const result = await convertToTinyEngineSchema(apiContent);
      return result;
    } catch (error) {
      return `转换失败：${error.message}，请检查输入是否为有效的API JSON数据`;
    }
  }
}

module.exports = {
  ElementApiCrawlerTool,
  TinyEngineConverterTool
};