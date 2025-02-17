import { loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import monacoEditorPluginCjs from 'vite-plugin-monaco-editor'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import esbuildCopy from 'esbuild-plugin-copy'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import visualizerCjs from 'rollup-plugin-visualizer'
import generateComment from '@opentiny/tiny-engine-vite-plugin-meta-comments'
import { getBaseUrlFromCli, copyBundleDeps, copyPreviewImportMap } from './localCdnFile/index.js'
import { devAliasPlugin } from './vite-plugins/devAliasPlugin.js'
import { htmlUpgradeHttpsPlugin } from './vite-plugins/upgradeHttpsPlugin.js'
import { canvasDevExternal } from './canvas-dev-external.js'

const monacoEditorPlugin = monacoEditorPluginCjs.default
const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default
const visualizer = visualizerCjs.default

const origin = 'http://localhost:9090/'

const getDefaultConfig = (engineConfig) => {
  const { root } = engineConfig

  return {
    base: './',
    publicDir: path.resolve(root, './public'),
    resolve: {
      extensions: ['.js', '.jsx', '.vue', '.ts', '.tsx'],
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
        },
        '/iconify/api': {
          target: 'https://api.iconify.design/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/iconify\/api/, '')
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
        reactivityTransform: path.resolve(root, 'src'),
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
}

export function useTinyEngineBaseConfig(engineConfig) {
  const { envDir = '', viteConfigEnv } = engineConfig
  const { command = 'serve', mode = 'serve' } = viteConfigEnv
  const env = loadEnv(mode, envDir)
  const { VITE_CDN_DOMAIN = 'https://unpkg.com', VITE_LOCAL_IMPORT_MAPS, VITE_LOCAL_BUNDLE_DEPS } = env
  const isLocalImportMap = VITE_LOCAL_IMPORT_MAPS === 'true' // true公共依赖库使用本地打包文件，false公共依赖库使用公共CDN
  const isCopyBundleDeps = VITE_LOCAL_BUNDLE_DEPS === 'true' // true bundle里的cdn依赖处理成本地依赖， false 不处理
  const monacoPublicPath = 'editor/monaco-workers'
  const monacoEditorPluginInstance = monacoEditorPlugin({
    publicPath: monacoPublicPath,
    forceBuildCDN: true,
    customDistPath: (_root, outDir, _base) => path.join(outDir, monacoPublicPath)
  })
  const config = getDefaultConfig(engineConfig)

  config.plugins.push(
    createSvgIconsPlugin({
      iconDirs: engineConfig.iconDirs || [],
      symbolId: 'icon-[name]',
      inject: 'body-last'
    }),
    monacoEditorPluginInstance,
    htmlUpgradeHttpsPlugin(mode),
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
          // FIXME: 相对路径需要修正
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

  config.plugins.push(devAliasPlugin(env, engineConfig.useSourceAlias))

  if (engineConfig.useSourceAlias && command === 'serve') {
    config.plugins.push(canvasDevExternal())
  }

  return config
}
