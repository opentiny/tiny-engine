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

export const NODE_UID = 'data-uid'
export const NODE_TAG = 'data-tag'
export const NODE_LOOP = 'loop-id'

export const addScript = (src, doc = document) => {
  return new Promise((resolve, reject) => {
    const script = doc.createElement('script')

    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', src)

    script.async = false

    script.onload = resolve
    script.onerror = reject

    doc.querySelector('head').appendChild(script)
  })
}

export const addStyle = (href, doc = document) => {
  return new Promise((resolve, reject) => {
    const link = doc.createElement('link')

    link.setAttribute('href', href)
    link.setAttribute('rel', 'stylesheet')

    link.onload = resolve
    link.onerror = reject

    doc.querySelector('head').appendChild(link)
  })
}

export const copyObject = (node) => {
  if (typeof node === 'object') {
    if (!node) {
      return node
    }

    if (Array.isArray(node)) {
      return node.map(copyObject)
    }

    const res = {}
    Object.keys(node).forEach((key) => {
      res[key] = copyObject(node[key])
    })

    const { componentName, id } = res

    if (componentName && id) {
      delete res.id
    }

    return res
  }

  return node
}

/**
 * 复制节点的schema对象到剪切板，以String形式保存
 * @param {*} event ClipboardEvent
 * @param {*} node 节点的schema对象
 * @return 复制的剪切板的String
 */
export const setClipboardSchema = (event, node) => {
  let text

  if (typeof node === 'object') {
    text = JSON.stringify(node)
  } else {
    text = String(node)
  }

  event.clipboardData.setData('text/plain', text)
  event.preventDefault()

  return text
}

const translateStringToSchame = (clipText) => {
  if (!clipText) {
    return null
  }

  let data

  try {
    data = JSON.parse(clipText)
    if (!data || !data.componentName) {
      data = null
    }
  } catch (error) {
    data = null
  }

  return data
}

/**
 * 获得剪切板的内容，转换成schema
 * @param {*} event ClipboardEvent
 * @return 节点的schema对象
 */
export const getClipboardSchema = (event) => translateStringToSchame(event.clipboardData.getData('text/plain'))

/**
 * 动态导入组件，缓存组件对象
 * @param {object} param0 组件的依赖： { package: 包名，script：js文件cdn, components：组件id和导出组件名的映射关系}
 * @returns
 */
export const dynamicImportComponents = async ({ package: pkg, script, components }) => {
  if (!script) return
  const scriptUrl = script.startsWith('.') ? new URL(script, location.href).href : script

  if (!window.TinyComponentLibs[pkg]) {
    const modules = await import(/* @vite-ignore */ scriptUrl)

    window.TinyComponentLibs[pkg] = modules
  }

  Object.entries(components).forEach(([componentId, exportName]) => {
    const modules = window.TinyComponentLibs[pkg]

    if (!window.TinyLowcodeComponent[componentId]) {
      window.TinyLowcodeComponent[componentId] = modules[exportName]
    }
  })
}

/**
 * 更新区块/组件依赖
 * @param {object} param0 依赖的CDN信息
 */
export const updateDependencies = ({ detail }) => {
  const { scripts = [], styles = [] } = detail || {}
  const { styles: canvasStyles } = window.thirdPartyDeps
  const newStyles = [...styles].filter((item) => !canvasStyles.has(item))

  newStyles.forEach((item) => canvasStyles.add(item))

  const promises = [...newStyles].map((src) => addStyle(src)).concat(scripts.map(dynamicImportComponents))

  Promise.allSettled(promises)
}
