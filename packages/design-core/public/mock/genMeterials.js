const baseUrl = 'https://element-plus.org'
const VERSION = '2.7.8'

const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

async function loadMenuData() {
  const url = 'https://element-plus.org/zh-CN/component/overview.html'
  const response = await axios.get(url)
  const html = response.data
  const $ = cheerio.load(html)
  const sidebarItems = $('.sidebar-group a')
  const data = []
  sidebarItems.each((index, element) => {
    const link = `${baseUrl}${$(element).attr('href')}.html`
    const text = $(element).text().trim()
    data.push({ text, link })
  })
  return data.filter((itemStr) => itemStr.text !== 'Overview 组件总览')
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
  const jsonString = JSON.stringify(jsonData, null, 2)
  const fullFilePath = filePath.endsWith('/') ? filePath + fileName : filePath + '/' + fileName
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

    const cleanedName = param.name.replace(/^\w+\s+/, '')

    const component = {
      id: components.length + 1,
      version: VERSION,
      name: { zh_CN: cleanedName },
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
  const snippets = []

  for (let i = 0; i < params.length; i++) {
    const param = params[i]
    const snippet = {
      id: snippets.length + 1,
      name: { zh_CN: `使用${param.name}` },
      description: `如何在Vue中使用${param.name}`,
      code: `<template>\n  <${param.name}></${param.name}>\n</template>`,
      language: 'Vue'
    }
    snippets.push(snippet)
  }
  return snippets
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
  try {
    const menus = await loadMenuData()
    const x = await loadBaseDataByMenus(menus)
    const m = await generateMaterial(x)
    generateJSONFile({ data: m }, 'bundle.json', './')
  } catch (error) {
    console.error('Error in main function:', error)
  }
}
main()
