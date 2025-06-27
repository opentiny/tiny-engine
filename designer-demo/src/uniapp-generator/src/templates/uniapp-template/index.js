import gitIgnoreFile from './templateFiles/.gitignore?raw'
import appVueFile from './templateFiles/App.vue?raw'
import envFile from './templateFiles/env.d.ts?raw'
import entryHTMLFile from './templateFiles/index.html?raw'
import packageJsonFile from './templateFiles/package.json?raw'
import mainTSFile from './templateFiles/main.ts?raw'
import manifestJson from './templateFiles/manifest.json?raw'
import getPagesJson from './templateFiles/pages'
import readmeFile from './templateFiles/README.md?raw'
import shimeFile from './templateFiles/shime-uni.d.ts?raw'
import shimeFile2 from './templateFiles/shime-uni2.d.ts?raw'
import scssFile from './templateFiles/uni.scss?raw'
import viteFile from './templateFiles/vite.config.ts?raw'
import ohPackageJson from './templateFiles/oh-package.json?raw'
// import indexVueFile from './templateFiles/pages/index/index.vue?raw'
import bridgeFile from './templateFiles/lowcodeConfig/bridge.js?raw'
import dataSourceFile from './templateFiles/lowcodeConfig/dataSource.js?raw'
import lowcodeJSFile from './templateFiles/lowcodeConfig/lowcode.js?raw'
import lowcodeStoreFile from './templateFiles/lowcodeConfig/store.js?raw'

/**
 * 模板写入动态内容
 * @param {*} schema
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
 * 生成uniapp项目模板
 * @param {*} schema
 * @returns
 */
export function generateTemplate(schema) {
  return [
    {
      fileType: 'json5',
      fileName: 'oh-package.json5',
      path: './harmony-mp-configs/entry',
      fileContent: getTemplate(schema, ohPackageJson)
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
      fileType: 'json',
      fileName: 'package.json',
      path: '.',
      fileContent: getTemplate(schema, packageJsonFile)
    },
    {
      fileType: 'md',
      fileName: 'README.md',
      path: '.',
      fileContent: getTemplate(schema, readmeFile)
    },
    {
      fileType: 'ts',
      fileName: 'shims-uni.d.ts',
      path: '.',
      fileContent: getTemplate(schema, shimeFile)
    },
    {
      fileType: 'ts',
      fileName: 'vite.config.ts',
      path: '.',
      fileContent: getTemplate(schema, viteFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.vue',
      path: './src',
      fileContent: getTemplate(schema, appVueFile)
    },
    {
      fileType: 'ts',
      fileName: 'env.d.ts',
      path: './src',
      fileContent: getTemplate(schema, envFile)
    },
    {
      fileType: 'ts',
      fileName: 'main.ts',
      path: './src',
      fileContent: getTemplate(schema, mainTSFile)
    },
    {
      fileType: 'json',
      fileName: 'manifest.json',
      path: './src',
      fileContent: getTemplate(schema, manifestJson)
    },
    {
      fileType: 'json',
      fileName: 'pages.json',
      path: './src',
      fileContent: getPagesJson(schema)
    },
    {
      fileType: 'ts',
      fileName: 'shime-uni.d.ts',
      path: './src',
      fileContent: getTemplate(schema, shimeFile2)
    },
    {
      fileType: 'scss',
      fileName: 'uni.scss',
      path: './src',
      fileContent: getTemplate(schema, scssFile)
    },
    // {
    //   fileType: 'vue',
    //   fileName: 'index.vue',
    //   path: './pages/index',
    //   fileContent: getTemplate(schema, indexVueFile)
    // },
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
    }
  ]
}
