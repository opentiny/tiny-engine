import readmeFile from './templateFiles/README.md?raw'
import genViteConfig from './templateFiles/genViteConfig'
import getPackageJson from './templateFiles/packageJson'
import gitIgnoreFile from './templateFiles/.gitignore?raw'
import entryHTMLFile from './templateFiles/index.html?raw'
import logoImage from './templateFiles/public/favicon.ico'
import mainJSFile from './templateFiles/src/main.js?raw'
import appVueFile from './templateFiles/src/App.vue?raw'
import bridgeFile from './templateFiles/src/lowcodeConfig/bridge.js?raw'
import dataSourceFile from './templateFiles/src/lowcodeConfig/dataSource.js?raw'
import lowcodeJSFile from './templateFiles/src/lowcodeConfig/lowcode.js?raw'
import lowcodeStoreFile from './templateFiles/src/lowcodeConfig/store.js?raw'
import axiosFile from './templateFiles/src/http/axios.js?raw'
import axiosConfigFile from './templateFiles/src/http/config.js?raw'
import httpEntryFile from './templateFiles/src/http/index.js?raw'

/**
 * 模板写入动态内容
 * @param {*} context
 * @param {*} str
 * @returns
 */
const getTemplate = (schema, str) => {
  return str.replace(/(\$\$TinyEngine{(.*)}END\$)/g, function (match, p1, p2) {
    if (!p2) {
      return ''
    }

    const keyArr = p2.split('.')
    const value = keyArr.reduce((preVal, key) => preVal?.[key] ?? '', schema)

    return value
  })
}

/**
 * 图片的 base64 转 Blob 对象，用于生成本地图片
 * @param {*} base64 String
 * @returns Blob
 */
const base64ToBlob = (base64Data) => {
  // Split base64
  const arr = base64Data.split(',')
  // Get MIME type
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch) {
    throw new Error('Invalid base64 data')
  }
  const mime = mimeMatch[1]
  // Decode base64 string
  let raw
  try {
    raw = window.atob(arr[1])
  } catch (e) {
    throw new Error('Failed to decode base64 string')
  }
  const rawLength = raw.length
  // Convert to Blob
  const uInt8Array = new Uint8Array(rawLength)
  for (let i = 0; i < rawLength; i++) {
    uInt8Array[i] = raw.charCodeAt(i)
  }
  return new Blob([uInt8Array], { type: mime })
}

/**
 * get project template
 * @returns
 */
export function generateTemplate(schema) {
  return [
    {
      fileType: 'md',
      fileName: 'README.md',
      path: '.',
      fileContent: getTemplate(schema, readmeFile)
    },
    {
      fileType: 'js',
      fileName: 'vite.config.js',
      path: '.',
      fileContent: genViteConfig(schema)
    },
    {
      fileType: 'json',
      fileName: 'package.json',
      path: '.',
      fileContent: getPackageJson(schema)
    },
    {
      fileName: '.gitignore',
      path: '.',
      fileContent: getTemplate(schema, gitIgnoreFile)
    },
    {
      fileType: 'html',
      fileName: 'index.html',
      path: '.',
      fileContent: getTemplate(schema, entryHTMLFile)
    },
    {
      fileType: 'image/x-icon',
      fileName: 'favicon.ico',
      path: './public',
      fileContent: base64ToBlob(logoImage)
    },
    {
      fileType: 'js',
      fileName: 'main.js',
      path: './src',
      fileContent: getTemplate(schema, mainJSFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.vue',
      path: './src',
      fileContent: getTemplate(schema, appVueFile)
    },
    {
      fileType: 'js',
      fileName: 'bridge.js',
      path: './src/lowcodeConfig',
      fileContent: bridgeFile
    },
    {
      fileType: 'js',
      fileName: 'dataSource.js',
      path: './src/lowcodeConfig',
      fileContent: dataSourceFile
    },
    {
      fileType: 'js',
      fileName: 'lowcode.js',
      path: './src/lowcodeConfig',
      fileContent: lowcodeJSFile
    },
    {
      fileType: 'js',
      fileName: 'store.js',
      path: './src/lowcodeConfig',
      fileContent: lowcodeStoreFile
    },
    {
      fileType: 'js',
      fileName: 'axios.js',
      path: './src/http',
      fileContent: axiosFile
    },
    {
      fileType: 'js',
      fileName: 'config.js',
      path: './src/http',
      fileContent: axiosConfigFile
    },
    {
      fileType: 'js',
      fileName: 'index.js',
      path: './src/http',
      fileContent: httpEntryFile
    }
  ]
}
