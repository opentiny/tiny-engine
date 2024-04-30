import { defineConfig, loadEnv } from 'vite'

import path from 'path'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPlugin from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import esbuildCopy from 'esbuild-plugin-copy'
import lowcodeConfig from './config/lowcode.config'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { importmapPlugin } from './scripts/externalDeps'
import visualizer from 'rollup-plugin-visualizer'

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
    vueJsx(),
    createSvgIconsPlugin({
      iconDirs: [
        path.resolve(__dirname, './assets/rf-resources/'), // 脚手架执行构建时将图元图片拷贝到此目录
        path.resolve(__dirname, './assets/')
      ],
      symbolId: 'icon-[name]',
      inject: 'body-last'
    })
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
        index: path.resolve(__dirname, './index.html'),
        canvas: path.resolve(__dirname, './canvas.html'),
        preview: path.resolve(__dirname, './preview.html'),
        previewApp: path.resolve(__dirname, './previewApp.html')
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
  tinyVue: '~3.11'
}

const devAlias = {
  '@opentiny/tiny-engine-controller/js': path.resolve(__dirname, '../controller/js'),
  '@opentiny/tiny-engine-common/component': path.resolve(__dirname, '../common/component'),
  '@opentiny/tiny-engine-common': path.resolve(__dirname, '../common/index.js'),
  '@opentiny/tiny-engine-controller/utils': path.resolve(__dirname, '../controller/utils.js'),
  '@opentiny/tiny-engine-controller/adapter': path.resolve(__dirname, '../controller/adapter.js'),
  '@opentiny/tiny-engine-controller': path.resolve(__dirname, '../controller/src/index.js'),
  '@opentiny/tiny-engine-plugin-materials': path.resolve(__dirname, '../plugins/materials/index.js'),
  '@opentiny/tiny-engine-plugin-block': path.resolve(__dirname, '../plugins/block/index.js'),
  '@opentiny/tiny-engine-plugin-data': path.resolve(__dirname, '../plugins/data/index.js'),
  '@opentiny/tiny-engine-plugin-datasource': path.resolve(__dirname, '../plugins/datasource/index.js'),
  '@opentiny/tiny-engine-plugin-script': path.resolve(__dirname, '../plugins/script/index.js'),
  '@opentiny/tiny-engine-plugin-tree': path.resolve(__dirname, '../plugins/tree/index.js'),
  '@opentiny/tiny-engine-plugin-help': path.resolve(__dirname, '../plugins/help/index.js'),
  '@opentiny/tiny-engine-plugin-schema': path.resolve(__dirname, '../plugins/schema/index.js'),
  '@opentiny/tiny-engine-plugin-page': path.resolve(__dirname, '../plugins/page/index.js'),
  '@opentiny/tiny-engine-plugin-i18n': path.resolve(__dirname, '../plugins/i18n/index.js'),
  '@opentiny/tiny-engine-plugin-bridge': path.resolve(__dirname, '../plugins/bridge/index.js'),
  '@opentiny/tiny-engine-plugin-tutorial': path.resolve(__dirname, '../plugins/tutorial/index.js'),
  '@opentiny/tiny-engine-plugin-robot': path.resolve(__dirname, '../plugins/robot/index.js'),
  '@opentiny/tiny-engine-setting-events': path.resolve(__dirname, '../settings/events/index.js'),
  '@opentiny/tiny-engine-setting-props': path.resolve(__dirname, '../settings/props/index.js'),
  '@opentiny/tiny-engine-setting-styles': path.resolve(__dirname, '../settings/styles/index.js'),
  '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(__dirname, '../toolbars/breadcrumb/index.js'),
  '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(__dirname, '../toolbars/fullscreen/index.js'),
  '@opentiny/tiny-engine-toolbar-lang': path.resolve(__dirname, '../toolbars/lang/index.js'),
  '@opentiny/tiny-engine-toolbar-layout': path.resolve(__dirname, '../toolbars/layout/index.js'),
  '@opentiny/tiny-engine-toolbar-checkinout': path.resolve(__dirname, '../toolbars/lock/index.js'),
  '@opentiny/tiny-engine-toolbar-logo': path.resolve(__dirname, '../toolbars/logo/index.js'),
  '@opentiny/tiny-engine-toolbar-logout': path.resolve(__dirname, '../toolbars/logout/index.js'),
  '@opentiny/tiny-engine-toolbar-media': path.resolve(__dirname, '../toolbars/media/index.js'),
  '@opentiny/tiny-engine-toolbar-preview': path.resolve(__dirname, '../toolbars/preview/index.js'),
  '@opentiny/tiny-engine-toolbar-generate-vue': path.resolve(__dirname, '../toolbars/generate-vue/index.js'),
  '@opentiny/tiny-engine-toolbar-refresh': path.resolve(__dirname, '../toolbars/refresh/index.js'),
  '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(__dirname, '../toolbars/redoundo/index.js'),
  '@opentiny/tiny-engine-toolbar-clean': path.resolve(__dirname, '../toolbars/clean/index.js'),
  '@opentiny/tiny-engine-toolbar-save': path.resolve(__dirname, '../toolbars/save/index.js'),
  '@opentiny/tiny-engine-toolbar-setting': path.resolve(__dirname, '../toolbars/setting/index.js'),
  '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(__dirname, '../toolbars/collaboration/index.js'),
  '@opentiny/tiny-engine-theme-dark': path.resolve(__dirname, '../theme/dark/index.less'),
  '@opentiny/tiny-engine-theme-light': path.resolve(__dirname, '../theme/light/index.less'),
  '@opentiny/tiny-engine-svgs': path.resolve(__dirname, '../svgs/index.js'),
  '@opentiny/tiny-engine-http': path.resolve(__dirname, '../http/src/index.js'),
  '@opentiny/tiny-engine-canvas': path.resolve(__dirname, '../canvas/src/index.js'),
  '@opentiny/tiny-engine-theme': path.resolve(__dirname, `../theme/${lowcodeConfig.theme}/index.less`),
  '@opentiny/tiny-engine-utils': path.resolve(__dirname, '../utils/src/index.js'),
  '@opentiny/tiny-engine-webcomponent-core': path.resolve(__dirname, '../webcomponent/src/lib.js'),
  '@opentiny/tiny-engine-i18n-host': path.resolve(__dirname, '../i18n/src/lib.js'),
  '@opentiny/tiny-engine-builtin-component': path.resolve(__dirname, '../builtinComponent/index.js')
}

const prodAlias = {
  '@opentiny/tiny-engine-theme': path.resolve(
    __dirname,
    `node_modules/@opentiny/tiny-engine-theme-${lowcodeConfig.theme}/dist/style.css`
  )
}

const commonAlias = {
  '@opentiny/tiny-engine-app-addons': path.resolve(__dirname, './config/addons.js')
}

export default defineConfig(({ command, mode }) => {
  const { VITE_CDN_DOMAIN } = loadEnv(mode, process.cwd(), '')
  const monacoPublicPath = {
    local: 'editor/monaco-workers',
    alpha: 'https://tinyengine-assets.obs.cn-north-4.myhuaweicloud.com/files/monaco-assets',
    prod: 'https://tinyengine-assets.obs.cn-north-4.myhuaweicloud.com/files/monaco-assets'
  }

  let monacoEditorPluginInstance = monacoEditorPlugin({ publicPath: monacoPublicPath.local })
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

    config.resolve.alias = [
      devVueAlias,
      ...Object.entries({ ...commonAlias, ...devAlias }).map(([find, replacement]) => ({
        find,
        replacement
      }))
    ]
  } else {
    // command === 'build'
    config.resolve.alias = { ...commonAlias, ...prodAlias }

    monacoEditorPluginInstance = monacoEditorPlugin({ publicPath: monacoPublicPath[mode] })

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
      '@opentiny/vue-theme/theme-tool': `${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/theme-tool`,
      '@opentiny/vue-theme/theme': `${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/theme`
    }
  }

  const importMapStyles = [`${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/index.css`]

  config.plugins.push(monacoEditorPluginInstance, htmlPlugin(mode), importmapPlugin(importmap, importMapStyles))

  return config
})
