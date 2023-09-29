/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { useHttp } from '@opentiny/tiny-engine-http'

const http = useHttp()

/**
 * vscode生成路由文件
 *
 *
 * @param { json } params
  {
     pageId:"123",   // 当前页面ID
     componentsTree:{}   //  整个应用的路由对象
  }
 * @returns { string }
 */

const generateRouter = (params) => http.post('/generate/api/generateRouter', params)

/**
 * vscode生成本地国际化词条
 *
 * @param { json } params
  {

    key:'lowcode.preview' // 词条的唯一key值
      contents: {
        en_US: "preview", // 英文
        zh_CN: "预览"    // 中文
    }
  }
 * @returns { string }
 */

const generateI18n = (params) => http.post('/generate/api/generateI18n', params)

/**
 * vscode生成区块
 *
 * @param { json } params
  {

    schema: '',  // 区块的schema
    blockPath: ''// 区块的分类ID，或者说传保存路径
}
 * @returns { string }
 */

const generateBlock = (params) => http.post('/generate/api/generateBlock', params)

/**
 * vscode生成页面
 *
 * @param { json } params
  {
    id: 2645,       // 页面ID
    name: 'xh-test', // 页面名称
    page_content:{}  //页面的schema
  }
 * @returns { string }
 */
const generatePage = (params) => http.post('/generate/api/generatePage', params)

/**
 * vscode生成数据源
 *
 * @param { json } params
  {
    list:[], // 新的数据源合集
    dataHanlder:{   
    //全局的处理函数，可以从apps/schema/:id 接口返回中的dataSource中获取
    type: "JSFunction",
    value: ""
  }
}
 * @returns { string }
 */
const generateDataSource = (params) => http.post('/generate/api/generateDataSource', params)

/**
 * vscode生成桥接源
 *
 * @param { json } params
  {
    //桥接源合集，可以从apps/schema/:id 接口返回中的bridge中获取
    bridge:[]
  }
 * @returns { string }
 */
const generateBridge = (params) => http.post('/generate/api/generateBridge', params)

/**
 * vscode生成工具类
 *
 * @param { json } params
  {
    //桥接源合集，可以从apps/schema/:id 接口返回中的utils中获取
    utils:[]
  }
 * @returns { string }
 */
const generateUtil = (params) => http.post('/generate/api/generateUtil', params)

export { generateRouter, generateI18n, generateBlock, generatePage, generateDataSource, generateBridge, generateUtil }
