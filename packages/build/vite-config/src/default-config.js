import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import monacoEditorPluginCjs from 'vite-plugin-monaco-editor'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import esbuildCopy from 'esbuild-plugin-copy'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { importmapPlugin } from './externalDeps.js'
import visualizerCjs from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'node:url'
import generateComment from '@opentiny/tiny-engine-vite-plugin-meta-comments'
import { getBaseUrlFromCli, copyBundleDeps, copyPreviewImportMap, copyLocalImportMap } from './localCdnFile/index.js'

const monacoEditorPlugin = monacoEditorPluginCjs.default
const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default
const visualizer = visualizerCjs.default

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const origin = 'http://localhost:9090/'

const config = {
  base: './',
  publicDir: path.resolve(__dirname, './public'),
  resolve: {
    extensions: ['.js', '.jsx', '.vue'],
    alias: {}
  },
  server: {
    // 这里保证本地启动服务是localhost,支持js多线程和谷歌浏览器读写本地文件api
    port: 8080,
    open: '/?type=app&id=918&tenant=1',
    proxy: {
      '/app-center/v1/api': {
        target: origin,
        changeOrigin: true
      },
      '/app-center/api': {
        target: origin,
        changeOrigin: true
      },
      '/material-center/api': {
        target: origin,
        changeOrigin: true
      },
      '/platform-center/api': {
        target: origin,
        changeOrigin: true
      }
    }
  },
  preview: {
    host: 'localhost',
    port: 8080,
    open: false
  },
  plugins: [
    generateComment(),
    visualizer({
      filename: 'tmp/report.html',
      title: 'Bundle Analyzer'
    }),
    vue({
      reactivityTransform: path.resolve(__dirname, 'src'),
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('tiny-i18n-host') || tag.startsWith('ng')
        }
      }
    }),
    vueJsx()
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        nodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
        nodeModulesPolyfillPlugin(),
        esbuildCopy({
          //@vue/repl monaco编辑器需要
          resolveFrom: 'cwd',
          assets: {
            from: ['./node_modules/@vue/repl/dist/assets/*'], // worker.js文件以url形式引用不会被esbuild拉起，需要手动复制
            to: ['./node_modules/.vite/assets'] // 开发态，js文件被缓存在.vite/deps，请求相对路径为.vite/assets
          },
          watch: true
        })
      ]
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // monaco-editor 满足 ESM 规范，防止被误转换
      exclude: ['node_modules/*monaco-editor*/**', 'node_modules/lodash-es/**', 'node_modules/@types/lodash-es/**']
    },
    minify: true,
    sourcemap: false,
    rollupOptions: {
      plugins: [nodePolyfill({ include: null })], // 使用@rollup/plugin-inject的默认值{include: null}, 即在所有代码中生效
      input: {
        index: path.resolve(process.cwd(), './index.html'),
        canvas: path.resolve(process.cwd(), './canvas.html'),
        preview: path.resolve(process.cwd(), './preview.html')
      },
      output: {
        manualChunks: (id) => {
          const chunksMap = {
            monaco: ['node_modules/monaco-editor'],
            prettier: ['node_modules/prettier'],
            vendor: ['node_modules']
          }
          for (const [chunkName, sourcePaths] of Object.entries(chunksMap)) {
            if (sourcePaths.some((item) => id.indexOf(item) > -1)) {
              return chunkName
            }
          }
          return undefined
        }
      }
    }
  }
}

const importMapVersions = {
  prettier: '2.7.1',
  vue: '3.4.23',
  tinyVue: '~3.14'
}

export default defineConfig(({ command = 'serve', mode = 'serve' }, extOptions) => {
  const { VITE_CDN_DOMAIN = 'https://npm.onmicrosoft.cn', VITE_LOCAL_IMPORT_MAPS, VITE_LOCAL_BUNDLE_DEPS } = extOptions

  const isLocalImportMap = VITE_LOCAL_IMPORT_MAPS === 'true' // true公共依赖库使用本地打包文件，false公共依赖库使用公共CDN
  const isCopyBundleDeps = VITE_LOCAL_BUNDLE_DEPS === 'true' // true bundle里的cdn依赖处理成本地依赖， false 不处理

  const monacoPublicPath = 'editor/monaco-workers'
  const monacoEditorPluginInstance = monacoEditorPlugin({
    publicPath: monacoPublicPath,
    forceBuildCDN: true,
    customDistPath: (_root, outDir, _base) => path.join(outDir, monacoPublicPath)
  })
  const htmlPlugin = (mode) => {
    const upgradeHttpsMetaTags = []
    const includeHtmls = ['index.html', 'preview.html', 'previewApp.html']

    if (mode === 'alpha' || mode === 'prod') {
      upgradeHttpsMetaTags.push({
        tag: 'meta',
        injectTo: 'head-prepend',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: 'upgrade-insecure-requests'
        }
      })
    }

    return {
      name: 'html-transform',
      transformIndexHtml: {
        enforce: 'pre',
        transform(html, { filename }) {
          return {
            html,
            tags: includeHtmls.includes(path.basename(filename)) ? upgradeHttpsMetaTags : []
          }
        }
      }
    }
  }

  if (command === 'serve') {
    const devVueAlias = {
      find: /^vue$/,
      replacement: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.js`
    }

    config.resolve.alias = [...(isLocalImportMap ? [] : [devVueAlias])]
  } else {
    // command === 'build'
    if (mode === 'prod') {
      config.build.minify = true
      config.build.sourcemap = false
    }
  }

  const importmap = {
    imports: {
      prettier: `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/standalone.mjs`,
      'prettier/': `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/`,
      'prettier/parser-typescript': `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/parser-typescript.mjs`,
      'prettier/parser-html': `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/parser-html.mjs`,
      'prettier/parser-postcss': `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/parser-postcss.mjs`,
      'prettier/parser-babel': `${VITE_CDN_DOMAIN}/prettier@${importMapVersions.prettier}/esm/parser-babel.mjs`,

      vue: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser${
        command === 'build' ? '.prod' : ''
      }.js`,
      '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue.mjs`,
      '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-icon.mjs`,
      '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-common.mjs`,
      '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-locale.mjs`,
      '@opentiny/vue-design-smb': `${VITE_CDN_DOMAIN}/@opentiny/vue-design-smb@${importMapVersions.tinyVue}/index.js`,
      '@opentiny/vue-theme/theme-tool': `${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/theme-tool.js`,
      '@opentiny/vue-theme/theme': `${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/theme/index.js`
    }
  }

  const importMapStyles = [`${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/index.css`]

  config.plugins.push(
    createSvgIconsPlugin({
      iconDirs: extOptions.iconDirs || [],
      symbolId: 'icon-[name]',
      inject: 'body-last'
    }),
    monacoEditorPluginInstance,
    htmlPlugin(mode),
    isLocalImportMap
      ? copyLocalImportMap({
          importMap: importmap,
          styleUrls: importMapStyles,
          originCdnPrefix: VITE_CDN_DOMAIN,
          base: getBaseUrlFromCli(config.base),
          packageCopy: [
            // 这两个包的js存在相对路径引用，不能单独拷贝一个文件，需要整个包拷贝
            '@opentiny/vue-theme/theme-tool',
            '@opentiny/vue-theme/theme'
          ]
        })
      : importmapPlugin(importmap, importMapStyles),
    isCopyBundleDeps
      ? copyBundleDeps({
          bundleFile: 'public/mock/bundle.json',
          targetBundleFile: 'mock/bundle.json',
          originCdnPrefix: VITE_CDN_DOMAIN, // mock 中bundle的域名当前和环境的VITE_CDN_DOMAIN一致
          base: getBaseUrlFromCli(config.base)
        }).plugin(command === 'serve')
      : [],
    isLocalImportMap
      ? copyPreviewImportMap({
          importMapJson: './src/preview/src/preview/importMap.json',
          targetImportMapJson: 'preview-import-map-static/preview-importmap.json',
          originCdnPrefix: VITE_CDN_DOMAIN,
          base: getBaseUrlFromCli(config.base),
          packageCopyLib: [
            // 以下的js存在相对路径引用，不能单独拷贝一个文件，需要整个包拷贝
            '@vue/devtools-api'
          ]
        })
      : []
  )
  return config
})
