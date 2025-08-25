const { Tool } = require("@langchain/core/tools");
const { crawlElementPlusAPI } = require("./element-api-crawler");
const { batchConvertToTinyEngineSchema } = require("./convertor");

/**
 * Element Plus API爬虫工具
 */
class ElementApiCrawlerTool extends Tool {
  name = "element_api_crawler";

  description = `
  用于爬取Element Plus组件库的API文档信息。
  输入：Element Plus组件文档的URL（如"https://element-plus.org/zh-CN/component/button.html"）
  输出：子组件API对象数组的JSON字符串（每个子组件含名称、描述、属性、事件、插槽等信息）。
  当需要获取组件原始API数据时使用此工具。
  `;

  async _call(input) {
    try {
      if (!input.startsWith('http')) {
        return "错误：请提供以http/https开头的有效Element Plus组件文档URL（如https://element-plus.org/zh-CN/component/button.html）";
      }

      const apiArray = await crawlElementPlusAPI(input);
      return JSON.stringify(apiArray, null, 2);
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
  用于将Element Plus组件API数据批量转换为符合tinyEngine协议的schema。
  输入：必须是element_api_crawler工具返回的JSON字符串（子组件API对象数组的序列化结果）。
  输出：JSON格式的转换结果（含每个子组件的schema、转换状态，成功/失败信息）。
  注意：必须先调用element_api_crawler获取API数据，才能使用此工具。
  `;

  async _call(input) {
    try {
      // 解析爬虫返回的JSON字符串
      let apiArray;
      try {
        apiArray = JSON.parse(input);
      } catch (parseError) {
        throw new Error(`输入解析失败：${parseError.message}（请确保输入是element_api_crawler返回的JSON字符串）`);
      }

      // 验证输入格式
      if (!Array.isArray(apiArray) || apiArray.length === 0) {
        throw new Error("输入无效：需为非空的子组件API对象数组（来自element_api_crawler工具）");
      }

      const conversionResults = await batchConvertToTinyEngineSchema(apiArray, undefined, true);

      // 返回JSON字符串（符合LangChain工具要求）
      return JSON.stringify({
        conversionSummary: `成功${conversionResults.filter(r => r.success !== false).length}个，失败${conversionResults.filter(r => r.success === false).length}个`,
        details: conversionResults
      }, null, 2);

    } catch (error) {
      return `转换失败：${error.message}`;
    }
  }
}

module.exports = {
  ElementApiCrawlerTool,
  TinyEngineConverterTool
};
