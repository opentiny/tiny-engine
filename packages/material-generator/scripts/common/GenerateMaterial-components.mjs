import axios from 'axios'
import markdownit from 'markdown-it'
import fs from 'fs'
import LocalCache from './cache.mjs';

function returnFunc(param) {
  if (typeof param === "function") {
    return param
  }
  if (Array.isArray(param)) {
    return param[0]
  }
  if (Array.isArray(param.type)) {
    return param.type[0]
  }
  return param.type
}

const DEFAULT_DESCRIPTION = "<empty comment>"

function generateType(param) {
  let type = ""
  let defaultValue = undefined
  let func = returnFunc(param)
  if (typeof func === "function") {
    type = func.name
  } else { }
  if ("defalut" in param) {
    defaultValue = param.defalut
  }
  switch (type) {
    case "Boolean":
      defaultValue = !!defaultValue
      break;
    default:
      break;
  }
  return { type, defaultValue }
}

class GenerateMaterial {
  _owner = undefined
  _repo = undefined
  _path = undefined
  _host = undefined
  _version = undefined
  _projectName = undefined
  _framework = undefined
  _requiredComponents = []
  _unnecessary = []
  _temporary_omit = []
  _script = undefined
  _css = undefined
  _exportNamePrefix = undefined
  _md = markdownit()
  _Module = undefined
  _middlewares = [];
  _lc = new LocalCache()

  _components = []
  _blocks = []
  _snippets = []
  _cached = []
  _default_actions = ["copy", "remove", "insert", "updateAttr", "bindEevent", "createBlock"]
  _need_cache_key = ['_components', '_blocks', '_snippets', '_framework', '_cached']
  _mdParams = []
  get url() {
    return `${this._host}/repos/${this._owner}/${this._repo}/contents/${this._path}`
  }

  constructor(params) {
    this._checkParams(params)
    this._owner = params.owner
    this._repo = params.repo
    this._path = params.path
    this._host = params.host
    this._version = params.version
    this._projectName = params.projectName
    this._framework = params.framework
    this._script = params.script
    this._css = params.css
    this._exportNamePrefix = params.exportNamePrefix
    this._Module = params.Module
    this._init()
  }

  async start() {
    // const files = await this._requestESMFile(this._script)
    const CurrentModule = this._Module
    const moduleKeys = Object.keys(CurrentModule)
    for (const key of moduleKeys) {
      const module = CurrentModule[key]
      if (!module.name) {
        console.log(`${key} 不是vue组件`)
        continue
      }
      this._generateMaterial(module)
    }
    // 中间件处理
    await this._execute()
    // 生成数据
    const jsonData = { data: this.data }
    this._generateJSONFile(jsonData, "bundle.json", ".")
  }

  _init() {

  }

  _to_save() {
    const caches = this._need_cache_key
    for (let i = 0; i < caches.length; i++) {
      const key = caches[i];
      this._lc.set(key, this[key])
    }
  }

  get data() {
    return {
      framework: this._framework,
      materials: {
        components: this._components,
        blocks: this._blocks,
        snippets: this._snippets,
      },
    }
  }

  async _requestGithub(url) {
    try {
      const res = await axios({
        url,
        headers: { 'Authorization': "Bearer " + this._token }
      })
      return res?.data || {}
    } catch (error) {
      console.log(error)
    }
  }

  async _requestESMFile(url) {
    try {
      const res = await axios({
        url
      })
      return res?.data || {}
    } catch (error) {
      console.log(error)
    }
  }

  get baseNpm() {
    return {
      package: this._repo,
      version: this._version,
      script: this._script,
      css: this._css,
      dependencies: null,
    }
  }

  _generateProperties(props) {
    const properties = {
      label: {
        zh_CN: "基础信息"
      },
      description: {
        zh_CN: "基础信息"
      },
      collapse: {
        number: 6,
        text: {
          zh_CN: "显示更多"
        }
      },
      content: []
    }
    let slots = {}
    const propsKeys = Object.keys(props)
    if (propsKeys.length) {
      // const res = this._chunk(attrs.content, attrs.col)
      for (const key of propsKeys) {
        const propsValue = props[key]
        if (!propsValue) {
          continue
        }
        if (!key.startsWith("on")) {
          if (propsValue === "") {
            console.log()
          }
          const typeObject = generateType(propsValue)
          const params = {
            property: key,
            description: DEFAULT_DESCRIPTION,
            type: String(typeObject.type).toLowerCase(),
            defaultValue: typeObject.defaultValue
          }
          const content_item = this._createPropertieContent(params)
          properties.content.push(content_item)
        }
      }
    }
    return { properties, slots }
  }

  _generateEvents(props) {
    const events = {}
    const eventList = Object.keys(props).filter((keyStr) => keyStr.startsWith("on"))
    if (eventList.length) {
      for (const key of eventList) {
        const content_item = this._createEventContent(key)
        Object.assign(events, content_item)
      }
    }
    return events
  }

  _generateComponent(params) {
    let { heading = {}, name, props = {} } = params
    const description = DEFAULT_DESCRIPTION
    const npm = {
      ...this.baseNpm,
      exportName: name
    }

    const { properties, slots } = this._generateProperties(props)
    const configure = {
      loop: true,
      condition: true,
      styles: true,
      isContainer: false,
      isModal: false,
      isPopper: false,
      nestingRule: {
        childWhitelist: "",
        parentWhitelist: "",
        descendantBlacklist: "",
        ancestorWhitelist: ""
      },
      isNullNode: false,
      isLayout: false,
      rootSelector: "",
      shortcuts: {
        properties: properties.content?.map(({ property }) => property) || []
      },
      contextMenu: {
        actions: this._default_actions,
        disable: []
      },
      invalidity: [""],
      clickCapture: true,
      framework: this._framework
    }
    const events = this._generateEvents(props)
    const shortcuts = {}
    const contentMenu = {}
    const schema = { properties: [properties], events, shortcuts, slots, contentMenu }
    const component = {
      id: this._components.length + 1,
      version: this._version,
      name: { "zh_CN": heading?.subtitle },
      component: npm.exportName,
      icon: name,
      description,
      doc_url: "",
      screenshot: "",
      tags: "",
      keywords: "",
      dev_mode: "proCode",
      npm,
      group: this._repo,
      category: this._projectName,
      configure,
      schema,
    }

    this._components.push(component)
  }

  _generateSnippets(params) {
    const { name } = params
    let snippet = this._snippets.find(({ group }) => group === this._repo)
    if (!snippet) {
      snippet = { group: this._repo, children: [] }
      this._snippets.push(snippet)
    }
    const nowComponent = {
      name: {
        zh_CN: name
      },
      icon: name,
      screenshot: "",
      snippetName: name,
      schema: {}
    }
    snippet.children.push(nowComponent)
  }

  async _generateMaterial(params) {
    this._generateComponent(params)
    this._generateSnippets(params)
  }

  _createPropertieContent(params) {
    let { property, description, type, defaultValue } = params;
    const widgetContent = this._createWidget({ type, defaultValue })
    return {
      property,
      label: {
        text: {
          zh_CN: property
        }
      },
      description: {
        zh_CN: description,
      },
      required: true,
      readOnly: false,
      disabled: false,
      cols: 12,
      labelPosition: "top",
      type: widgetContent.type,
      defaultValue: widgetContent.defaultValue,
      widget: widgetContent.widget
    }
  }

  _createEventContent(name) {
    return {
      [name]: {
        label: {
          zh_CN: DEFAULT_DESCRIPTION
        },
        description: {
          zh_CN: DEFAULT_DESCRIPTION
        },
        type: "event"
      }
    }
  }

  _createWidget(params) {
    let { type, defaultValue } = params
    const result = {}
    if (type.includes('|')) {
      const types = type.split('|').map((str) => str.trim())
      const isString = types.every((str) => str.startsWith('`') && str.endsWith('`'))
      if (isString) {
        type = 'string'
        result.widget = {
          component: 'MetaSelect',
          props: {
            options: types.map((item) => (
              {
                label: item.slice(1, item.length - 1),
                value: item.slice(1, item.length - 1)
              }
            ))
          }
        }
      }
      const isBoolean = types.some((str) => str === 'boolean')
      if (isBoolean) {
        result.widget = { component: 'MetaSwitch', props: {} }
        result.defaultValue = String(defaultValue).includes("false") ? false : true
      }
    }
    result.type = type
    switch (type) {
      case 'boolean':
        result.widget = { component: 'MetaSwitch', props: {} }
        result.defaultValue = String(defaultValue).includes("false") ? false : true
        break;
      case '':
        result.widget = { component: 'MetaSwitch', props: {} }
        result.defaultValue = String(defaultValue).includes("false") ? false : true
        break;
      case 'number':
        !result.widget && (result.widget = { component: 'MetaNumber', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'array':
        !result.widget && (result.widget = { component: 'MetaCodeEditor', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'function':
        !result.widget && (result.widget = { component: 'MetaCodeEditor', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'date':
        !result.widget && (result.widget = { component: 'MetaCodeEditor', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'object':
        !result.widget && (result.widget = { component: 'MetaCodeEditor', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'string':
        !result.widget && (result.widget = { component: 'MetaInput', props: {} })
        result.defaultValue = defaultValue
        break;
      case 'v-slot':
        !result.widget && (result.widget = { component: 'MetaJsSlot', props: { slots: ['default'] } })
        result.defaultValue = defaultValue
        break;
      case 'slot':
        !result.widget && (result.widget = { component: 'MetaJsSlot', props: { slots: ['default'] } })
        result.defaultValue = defaultValue
        break;
      default:
        break;
    }
    if (!result.widget) {
      console.log()
    }
    return result
  }

  _chunk(array, size = 1) {
    size = Math.max(Number(size), 0)
    const length = array == null ? 0 : array.length
    if (!length || size < 1) {
      return []
    }
    let index = 0
    let resIndex = 0
    const result = new Array(Math.ceil(length / size))

    while (index < length) {
      result[resIndex++] = array.slice(index, (index += size))
    }
    return result
  }

  _isAttributeTable(params) {
    throw new Error("需要传入 isAttributeTable")
  }

  _isEvent(params) {
    throw new Error("需要传入 isEvent")
  }

  _generateJSONFile(jsonData, fileName = 'output.json', filePath = './') {
    // 将 JSON 数据转换为字符串
    const jsonString = JSON.stringify(jsonData, null, 2);

    // 拼接文件路径
    const fullFilePath = filePath.endsWith('/') ? filePath + fileName : filePath + '/' + fileName;

    // 写入文件
    fs.writeFile(fullFilePath, jsonString, 'utf8', (err) => {
      if (err) {
        console.error('写入文件时出错：', err);
      } else {
        console.log(`JSON 数据已成功写入到文件 ${fullFilePath}`);
      }
    });
  }

  _atob_cn(base64String) {
    const bytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
    const decodedString = new TextDecoder('utf-8').decode(bytes)
    return decodedString
  }

  _getBaseInfo(tokens) {
    let description = undefined
    let heading = undefined
    // let name = undefined
    // 寻找表格内容
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (!description && token.type === "paragraph_open") {
        description = tokens[i + 1].content
      }
      if (!heading && token.type === "heading_open") {
        const content = tokens[i + 1].content
        const heads = content.split("\n")
        heading = {}
        heads.forEach((item) => {
          const kv = item.split(": ")
          heading[kv[0]] = kv[1]
        })
      }
    }
    return { description, heading }
  }

  _getMdTableInfo(tokens) {
    let tableContent = null
    const tableContents = []
    const titles = this._parseTitle(tokens)
    let col = 0 // 列数
    // 寻找表格内容
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type === 'table_open') {
        col = 0
        tableContent = {
          content: [],
          row: 0,
          col,
          parents: [],
          parentMap: {}
        }
        let endIndex = undefined
        for (let t = 0; t < titles.length; t++) {
          const { index } = titles[t];
          if (index > i && endIndex === undefined) {
            endIndex = t
            break;
          }
        }
        const newTitles = titles.slice(0, endIndex).reverse()
        let first_title_index = (newTitles[0] || {}).index
        if (first_title_index) {
          tableContent.parents.push(newTitles[0])
        }
        for (let j = 0; j < newTitles.length; j++) {
          const title = newTitles[j];
          if (title.index > first_title_index) {
            tableContent.parents.push(title)
            first_title_index = title.index
          }
        }
      } else if (token.type === 'thead_close') {
        tableContent.col = col
      } else if (token.type === 'table_close') {
        tableContent.row = tableContent.content.length / tableContent.col
        tableContents.push(tableContent)
        tableContent = null
      } else if (tableContent && token.type === 'inline') {
        const content = token.content
        col++
        tableContent.content.push(content)
      }
    }
    return { tables: tableContents }
  }

  _parseTitle(tokens) {
    const titles = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type === 'heading_open' && token.markup && token.markup.includes("#")) {
        const content = tokens[i + 1].content
        const title = {
          level: String(token.markup).length,
          content,
          index: i
        }
        titles.push(title)
      }
    }
    return titles
  }

  _parseMd(mdStrBase64) {
    const mdStr = this._atob_cn(mdStrBase64)
    let result = undefined
    try {
      result = this._md.parse(mdStr, {})
    } catch (error) {
      console.log(mdStr)
      throw new Error(error)
    }
    const tablesInfo = this._getMdTableInfo(result)
    const info = this._getBaseInfo(result)
    return { ...tablesInfo, ...info }
  }

  _checkParams(params) {
    if (!params) {
      throw new Error('Initialization requires passing in parameters');
    }
    const requiredProperties = [
      'version',
      'Module',
      'framework',
      'script',
      'css',
      'exportNamePrefix',
    ]
    for (let prop of requiredProperties) {
      if (!(prop in params)) {
        throw new Error(`Property '${prop}' is missing from the params.`);
      }
    }
  }

  add(middleware) {
    this._middlewares.push(middleware);
  }

  // 执行中间件
  async _execute() {
    let components = this._components;
    let blocks = this._blocks;
    let snippets = this._snippets;
    let result = { components, blocks, snippets }
    for (const fn of this._middlewares) {
      result = await fn(result); // 调用中间件函数，传入参数 A，并更新结果
    }
    this._components = result.components// 返回最终结果
    this._snippets = result.snippets// 返回最终结果
    this._blocks = result.blocks// 返回最终结果
  }
}
export default GenerateMaterial