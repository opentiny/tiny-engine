const baseUrl = 'https://element-plus.org'
const VERSION = '2.7.8'

const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

function createConfigure(params) {
  return {
    loop: true,
    condition: true,
    styles: true,
    isContainer: false,
    isModal: false,
    isPopper: false,
    nestingRule: {
      childWhitelist: '',
      parentWhitelist: '',
      descendantBlacklist: '',
      ancestorWhitelist: ''
    },
    isNullNode: false,
    isLayout: false,
    rootSelector: '',
    shortcuts: {
      properties: params || []
    },
    contextMenu: {
      actions: ['copy', 'remove', 'insert', 'updateAttr', 'bindEevent', 'createBlock'],
      disable: []
    },
    invalidity: [''],
    clickCapture: true,
    framework: 'Vue'
  }
}

function createSchema(params) {
  // 这个函数的作用是：将参数转为
  const result = {
    properties: [],
    events: {},
    slots: {}
  }
  const widgetTypeMap = {
    string: 'MetaInput',
    enum: 'MetaSelect',
    boolean: 'MetaSwitch',
    function: 'MetaCodeEditor',
    object: 'MetaCodeEditor'
  }
  const typeTypeMap = {
    string: 'MetaInput',
    enum: 'MetaSelect',
    boolean: 'MetaSwitch',
    function: 'MetaCodeEditor',
    object: 'MetaCodeEditor'
  }

  // 处理属性
  params.tables.forEach((table) => {
    if (table.tableName.includes('属性') || table.tableName.includes('Attributes')) {
      const propertyGroup = {
        name: '0',
        label: { zh_CN: table.tableName.trim() },
        description: { zh_CN: table.tableName.trim() },
        content: []
      }

      table.bodys.forEach((row) => {
        const [property, description, type, defaultValue] = row
        propertyGroup.content.push({
          property: property.split(' ')[0],
          label: {
            text: { zh_CN: property.split(' ')[0] }
          },
          description: {
            zh_CN: description
          },
          type: type === 'enum' ? 'string' : type,
          required: true, // 根据你的需求，这个可以设置为 true 或 false
          readOnly: false,
          disabled: false,
          cols: 12,
          labelPosition: 'top',
          widget: {
            component: widgetTypeMap[type] || '__ERROR__',
            props: {
              slots: ['default']
            }
          }
        })
      })

      result.properties.push(propertyGroup)
    }

    // 处理插槽
    if (table.tableName.includes('插槽') || table.tableName.includes('Slots')) {
      table.bodys.forEach(([slot, description, subTag]) => {
        result.slots[slot] = {
          label: { zh_CN: slot },
          description: { zh_CN: description }
        }
        if (subTag) {
          result.slots[slot].subTag = subTag
        }
      })
    }

    // 处理方法（如果需要的话）
    if (table.tableName.includes('方法') || table.tableName.includes('Events')) {
      table.bodys.forEach((row) => {
        const [property, description, type] = row
        // 在这里添加方法的处理逻辑
        // 示例: result.methods[property] = { description, type };
      })
    }
  })

  return result
}

async function loadMenuData() {
  const url = 'https://element-plus.org/zh-CN/component/overview.html'
  const response = await axios.get(url)
  const html = response.data
  const $ = cheerio.load(html)
  const sidebarItems = $('.sidebar-group')
  const data = []

  sidebarItems.each((index, element) => {
    const tagP = $(element).find('.sidebar-group__title')
    const tagAList = $(element).find('a')
    const tagPText = tagP.text()
    tagAList.each((i, item) => {
      const link = `${baseUrl}${$(item).attr('href')}.html`
      const text = $(item).text().trim()
      data.push({ text, link, group: tagPText })
    })
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
    const desc = $('h1 + p').text()
    const tables = []
    let objName = {
      name: menu.text,
      desc,
      group: menu.group,
      tables
      // children: []
    }
    sidebarItems.each((index, table) => {
      const thItems = $(table).find('tr th')
      const thtdItems = $(table).find('tr td')
      const prevNodeTitle = $(table).prev().text()
      const headers = []
      let wrapBodys = []
      const bodys = []
      const tableObj = { headers, bodys: [], tableName: prevNodeTitle }
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
    // objName.children = tables // Assuming tables correspond to children in this context
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

    const getName = (str) => str.split(' ')[0]
    const name = getName(param.name)

    // Button
    const component = {
      id: components.length + 1,
      version: VERSION,
      name: { zh_CN: cleanedName },
      component: `El${name}`,
      icon: String(name).toLowerCase(),
      description: param.desc,
      doc_url: '',
      screenshot: '',
      tags: '',
      keywords: '',
      dev_mode: 'proCode',
      npm: {
        package: 'element-plus',
        version: VERSION,
        script: 'https://npm.onmicrosoft.cn/element-plus@2.4.2/dist/index.full.mjs',
        css: 'https://npm.onmicrosoft.cn/element-plus@2.4.2/dist/index.css',
        dependencies: null,
        exportName: `El${name}`
      },
      group: param.group,
      category: 'element-plus',
      configure: createConfigure(),
      schema: createSchema(param)
    }
    components.push(component)
  }
  return components
}

async function generateSnippets(params) {
  const snippets = []
  const snippetChildrens = []
  for (let i = 0; i < params.length; i++) {
    const param = params[i]

    const snippetChildren = {
      name: { zh_CN: param.name['zh_CN'] },
      icon: param.icon, // Default icon, you can customize it
      screenshot: '', // Screenshot URL or path, if available
      snippetName: param.component,
      schema: {} // Schema structure, populate as needed
    }
    snippetChildrens.push(snippetChildren)
  }

  const snippet = {
    group: 'element-plus',
    children: snippetChildrens
  }

  snippets.push(snippet)

  return snippets
}

async function generateMaterial(params) {
  const components = await generateComponent(params)
  const blocks = []
  const snippets = await generateSnippets(components)
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
    const onlyFirst = menus.slice(0, 1)
    const x = await loadBaseDataByMenus(onlyFirst)
    const m = await generateMaterial(x)
    generateJSONFile({ data: m }, 'bundle.json', './')
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

main()
