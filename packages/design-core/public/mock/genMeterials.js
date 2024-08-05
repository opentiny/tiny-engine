const baseUrl = 'https://element-plus.org'
const VERSION = '2.7.8'
/* const match = [
  "Button",
  "Layout",
  "Link",
]; */
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

async function loadMenuData() {
  // 目标URL
  const url = 'https://element-plus.org/zh-CN/component/overview.html'

  // 发送HTTP请求并获取HTML内容
  const response = await axios.get(url)
  const html = response.data
  const $ = cheerio.load(html)

  // 选择侧边栏的元素，这里假设侧边栏在一个特定的容器内
  // 请根据实际情况调整选择器
  const sidebarItems = $('.sidebar-group a')

  // 提取链接和文本
  const data = []
  sidebarItems.each((index, element) => {
    // https://element-plus.org/zh-CN/component/button.html
    const link = `${baseUrl}${$(element).attr('href')}.html`
    const text = $(element).text().trim()
    data.push({ text, link })
  })

  // 输出结果
  console.log(data)
  return data.filter((itemStr) => {
    /* return match.find((itemMatStr) => (itemStr.text || "").startsWith(itemMatStr));
    }) */
    return itemStr.text !== 'Overview 组件总览'
  })
}

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

async function loadBaseDataByMenus(menus) {
  let result = []
  for (let i = 0; i < menus.length; i++) {
    const menu = menus[i]
    const response = await axios.get(menu.link)
    const html = response.data
    const $ = cheerio.load(html)
    const sidebarItems = $('.vp-table')
    const tables = []
    let objName = {
      name: menu.text,
      tables
    }
    // 遍历每个表格
    sidebarItems.each((index, table) => {
      const thItems = $(table).find('tr th')
      const thtdItems = $(table).find('tr td')
      const headers = []
      let wrapBodys = []
      const bodys = []
      const tableObj = { headers, bodys: [] }
      thItems.each((i, th) => {
        headers.push($(th).text().trim())
      })
      thtdItems.each((i, th) => {
        bodys.push($(th).text().trim())
      })
      wrapBodys = chunk(bodys, headers.length)
      tableObj.bodys = wrapBodys
      tables.push(tableObj)
    })
    result.push(objName)
  }
  return result
}

function generateJSONFile(jsonData, fileName = 'output.json', filePath = './') {
  // 将 JSON 数据转换为字符串
  const jsonString = JSON.stringify(jsonData, null, 2)

  // 拼接文件路径
  const fullFilePath = filePath.endsWith('/') ? filePath + fileName : filePath + '/' + fileName

  // 写入文件
  fs.writeFile(fullFilePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('写入文件时出错：', err)
    } else {
      console.log(`JSON 数据已成功写入到文件 ${fullFilePath}`)
    }
  })
}

async function generateComponent(params) {
  const components = []

  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    const component = {
      id: components.length + 1,
      version: VERSION,
      name: { zh_CN: param.name },
      component: param.name,
      icon: '',
      description: '',
      doc_url: param.tables.length > 0 ? param.tables[0].link : '',
      screenshot: '',
      tags: '',
      keywords: '',
      dev_mode: 'proCode',
      npm: {
        package: 'element-plus',
        version: VERSION,
        exportName: param.name,
        main: 'lib/index.js',
        destructuring: true,
        subName: ''
      },
      group: '',
      category: 'element-plus',
      configure: {},
      schema: {}
    }
    components.push(component)
  }
  return components
}

async function generateSnippets(params) {
  return []
}

async function generateMaterial(params) {
  const components = await generateComponent(params)
  const blocks = []
  const snippets = await generateSnippets(params)
  const result = {
    framework: 'Vue',
    materials: {
      components,
      blocks,
      snippets
    }
  }
  return result
}

async function main() {
  // 1. 爬取相关的数据
  //  https://element-plus.org/zh-CN/component/overview.html
  const menus = await loadMenuData()
  const x = await loadBaseDataByMenus(menus)
  // 2. 按照标准处理相关的数据
  const m = await generateMaterial(x)
  // 3. 生成相关的物料文件
  generateJSONFile({ data: m }, 'bundle.json', './')
}

main()
