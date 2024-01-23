import readmeFile from './templateFiles/README.md?raw'
import viteConfigFile from './templateFiles/vite.config.js?raw'
import getPackageJson from './templateFiles/packageJson'
import gitIgnoreFile from './templateFiles/.gitignore?raw'
import entryHTMLFile from './templateFiles/index.html?raw'
import mainJSFile from './templateFiles/src/main.js?raw'
import appVueFile from './templateFiles/src/App.vue?raw'
import bridgeFile from './templateFiles/src/lowcodeConfig/bridge.js?raw'
import dataSourceFile from './templateFiles/src/lowcodeConfig/dataSource.js?raw'
import lowcodeJSFile from './templateFiles/src/lowcodeConfig/lowcode.js?raw'
import axiosFile from './templateFiles/src/http/axios.js?raw'
import axiosConfigFile from './templateFiles/src/http/config.js?raw'
import httpEntryFile from './templateFiles/src/http/index.js?raw'

/**
 * 模板写入动态内容
 * @param {*} context
 * @param {*} str
 * @returns
 */
const getTemplate = (context, str) => {
  return str.replace(/(\$\$TinyEngine{(.*)}END\$)/g, function (match, p1, p2) {
    if (!p2) {
      return ''
    }
    const keyArr = p2.split('.')
    const value = keyArr.reduce((preVal, key) => preVal?.[key] ?? '', context)
    return value
  })
}

/**
 * get project template
 * @returns
 */
export function generateTemplate(context) {
  return [
    {
      fileType: 'md',
      fileName: 'README.md',
      paths: '.',
      fileContent: getTemplate(context, readmeFile)
    },
    {
      fileType: 'js',
      fileName: 'vite.config.js',
      paths: '.',
      fileContent: getTemplate(context, viteConfigFile)
    },
    {
      fileType: 'json',
      fileName: 'package.json',
      paths: '.',
      fileContent: getPackageJson(context)
    },
    {
      fileName: '.gitignore',
      paths: '.',
      fileContent: getTemplate(context, gitIgnoreFile)
    },
    {
      fileType: 'html',
      fileName: 'index.html',
      paths: '.',
      fileContent: getTemplate(context, entryHTMLFile)
    },
    {
      fileType: 'js',
      fileName: 'main.js',
      paths: './src',
      fileContent: getTemplate(context, mainJSFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.vue',
      paths: './src',
      fileContent: getTemplate(context, appVueFile)
    },
    {
      fileType: 'js',
      fileName: 'bridge.js',
      paths: './src/lowcodeConfig',
      fileContent: bridgeFile
    },
    {
      fileType: 'js',
      fileName: 'dataSource.js',
      paths: './src/lowcodeConfig',
      fileContent: dataSourceFile
    },
    {
      fileType: 'js',
      fileName: 'lowcode.js',
      paths: './src/lowcodeConfig',
      fileContent: lowcodeJSFile
    },
    {
      fileType: 'js',
      fileName: 'axios.js',
      paths: './src/http',
      fileContent: axiosFile
    },
    {
      fileType: 'js',
      fileName: 'config.js',
      paths: './src/http',
      fileContent: axiosConfigFile
    },
    {
      fileType: 'js',
      fileName: 'index.js',
      paths: './src/http',
      fileContent: httpEntryFile
    }
  ]
}
