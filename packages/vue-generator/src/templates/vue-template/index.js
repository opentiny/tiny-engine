import readmeFile from './templateFiles/README.md?raw'
import genViteConfig from './templateFiles/genViteConfig'
import getPackageJson from './templateFiles/packageJson'
import gitIgnoreFile from './templateFiles/.gitignore?raw'
import entryHTMLFile from './templateFiles/index.html?raw'
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
