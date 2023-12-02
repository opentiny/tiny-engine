import { generateTemplate } from '../templates/vue-template'

const templateMap = {
  default: generateTemplate
}

// function

function generateI18n() {}

function generateDataSource() {}

function generatePageOrComponent() {}

function generateRouter() {}

function generateDependencies() {}

/**
 * 整体应用出码
 */
export function generateApp(config, appSchema) {
  // 预处理 app schema

  // 初始化模板
  const { staticTemplate } = config

  if (typeof staticTemplate === 'function') {
    staticTemplate({})
  }

  // 国际化出码

  // 数据源出码
  // 页面出码
  // 区块出码
  // utils  工具类出码
  // 路由出码
  // 依赖出码
}
