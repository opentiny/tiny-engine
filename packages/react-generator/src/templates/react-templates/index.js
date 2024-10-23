import readmeFile from './template-files/README.md?raw'
import genViteConfig from './template-files/genViteConfig'
import getPackageJson from './template-files/packageJson'
import gitIgnoreFile from './template-files/.gitignore?raw'
import entryHTMLFile from './template-files/index.html?raw'
import mainJSFile from './template-files/src/index.js?raw'
import appVueFile from './template-files/src/App.jsx?raw'
import bridgeFile from './template-files/src/lowcodeConfig/bridge.js?raw'
import dataSourceFile from './template-files/src/lowcodeConfig/dataSource.js?raw'
import lowcodeJSFile from './template-files/src/lowcodeConfig/lowcode.js?raw'
import lowcodeStoreFile from './template-files/src/lowcodeConfig/store.js?raw'
import axiosFile from './template-files/src/http/axios.js?raw'
import axiosConfigFile from './template-files/src/http/config.js?raw'
import httpEntryFile from './template-files/src/http/index.js?raw'
import useLazyFile from './template-files/src/hooks/useLazy.jsx?raw'

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
      fileName: 'index.jsx',
      path: './src',
      fileContent: getTemplate(schema, mainJSFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.jsx',
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
    },
    {
      fileType: 'jsx',
      fileName: 'uselazy.jsx',
      path: './src/hooks',
      fileContent: useLazyFile
    }
  ]
}
