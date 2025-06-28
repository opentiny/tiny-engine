/**
 * 生成pages.json文件内容
 * @param {*} schema 
 * @returns 
 */
export default function getPagesJson(schema) {
  // 从schema中提取页面配置，如果没有则使用默认配置
  const pages = schema.pages || [
    {
      path: "pages/index/index",
      style: {
        navigationBarTitleText: "首页"
      }
    }
  ]
  
  // 从schema中提取全局样式配置，如果没有则使用默认配置
  const globalStyle = schema.globalStyle || {
    navigationBarTextStyle: "black",
    navigationBarTitleText: schema.projectName || "TinyEngine UniApp",
    navigationBarBackgroundColor: "#F8F8F8",
    backgroundColor: "#F8F8F8"
  }
  
  // 从schema中提取tabBar配置，如果没有则不添加tabBar
  const tabBar = schema.tabBar || null
  
  // 构建基本配置
  const config = {
    pages,
    globalStyle
  }
  
  // 如果有tabBar配置，添加到配置中
  if (tabBar) {
    config.tabBar = tabBar
  }
  
  // 添加条件编译配置
  config.condition = {
    current: 0,
    list: [
      {
        name: "首页",
        path: "pages/index/index"
      }
    ]
  }
  
  // 添加easycom配置，用于自动导入组件
  config.easycom = {
    autoscan: true,
    custom: {
      "^uni-(.*)": "@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue"
    }
  }
  
  return config
}