import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPlugin from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import lowcodeConfig from './src/app/config/lowcode.config'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { importmapPlugin } from './scripts/externalDeps'
import visualizer from 'rollup-plugin-visualizer'

const origin = 'http://localhost:9090/'
const config = {
  base: './',
  publicDir: path.resolve(__dirname, './src/app/public'),
  resolve: {
    extensions: ['.js', '.jsx', '.vue'],
    alias: {}
  },
  server: {
    // 这里保证本地启动服务是localhost,支持js多线程和谷歌浏览器读写本地文件api
    port: 8080,
    open: true,
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
        path.resolve(process.cwd(), 'src/app/assets/rf-resources/'), // 脚手架执行构建时将图元图片拷贝到此目录
        path.resolve(process.cwd(), 'src/app/assets/')
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
        nodeModulesPolyfillPlugin()
      ]
    }
  },
  define: {
    'process.env': process.env
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
  vue: '3',
  tinyVue: '3'
}

const devAlias = {
  // 有第三方依赖时，需要打开下行。因为第三方CDN依赖的vue来自importmap，本地项目来自node_modules，导致不是同一实例。在预览时需要注释掉。
  // vue: `https://unpkg.com/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.js`,
  '@opentiny/tiny-engine-common/js': path.resolve(__dirname, 'src/common/js'),
  '@opentiny/tiny-engine-common/component': path.resolve(__dirname, 'src/common/component'),
  '@opentiny/tiny-engine-common': path.resolve(__dirname, 'src/common/index.js'),
  '@opentiny/tiny-engine-controller/utils': path.resolve(__dirname, 'src/controller/utils.js'),
  '@opentiny/tiny-engine-controller/adapter': path.resolve(__dirname, 'src/controller/adapter.js'),
  '@opentiny/tiny-engine-controller': path.resolve(__dirname, 'src/controller/src/index.js'),
  '@opentiny/tiny-engine-plugin-materials': path.resolve(__dirname, 'src/plugins/packages/materials/index.js'),
  '@opentiny/tiny-engine-plugin-block': path.resolve(__dirname, 'src/plugins/packages/block/index.js'),
  '@opentiny/tiny-engine-plugin-data': path.resolve(__dirname, 'src/plugins/packages/data/index.js'),
  '@opentiny/tiny-engine-plugin-datasource': path.resolve(__dirname, 'src/plugins/packages/datasource/index.js'),
  '@opentiny/tiny-engine-plugin-script': path.resolve(__dirname, 'src/plugins/packages/script/index.js'),
  '@opentiny/tiny-engine-plugin-tree': path.resolve(__dirname, 'src/plugins/packages/tree/index.js'),
  '@opentiny/tiny-engine-plugin-help': path.resolve(__dirname, 'src/plugins/packages/help/index.js'),
  '@opentiny/tiny-engine-plugin-schema': path.resolve(__dirname, 'src/plugins/packages/schema/index.js'),
  '@opentiny/tiny-engine-plugin-page': path.resolve(__dirname, 'src/plugins/packages/page/index.js'),
  '@opentiny/tiny-engine-plugin-i18n': path.resolve(__dirname, 'src/plugins/packages/i18n/index.js'),
  '@opentiny/tiny-engine-plugin-bridge': path.resolve(__dirname, 'src/plugins/packages/bridge/index.js'),
  '@opentiny/tiny-engine-plugin-tutorial': path.resolve(__dirname, 'src/plugins/packages/tutorial/index.js'),
  '@opentiny/tiny-engine-plugin-robot': path.resolve(__dirname, 'src/plugins/packages/robot/index.js'),
  '@opentiny/tiny-engine-setting-events': path.resolve(__dirname, 'src/settings/packages/events/index.js'),
  '@opentiny/tiny-engine-setting-props': path.resolve(__dirname, 'src/settings/packages/props/index.js'),
  '@opentiny/tiny-engine-setting-styles': path.resolve(__dirname, 'src/settings/packages/styles/index.js'),
  '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(__dirname, 'src/toolbars/packages/breadcrumb/index.js'),
  '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(__dirname, 'src/toolbars/packages/fullscreen/index.js'),
  '@opentiny/tiny-engine-toolbar-lang': path.resolve(__dirname, 'src/toolbars/packages/lang/index.js'),
  '@opentiny/tiny-engine-toolbar-layout': path.resolve(__dirname, 'src/toolbars/packages/layout/index.js'),
  '@opentiny/tiny-engine-toolbar-checkinout': path.resolve(__dirname, 'src/toolbars/packages/lock/index.js'),
  '@opentiny/tiny-engine-toolbar-logo': path.resolve(__dirname, 'src/toolbars/packages/logo/index.js'),
  '@opentiny/tiny-engine-toolbar-logout': path.resolve(__dirname, 'src/toolbars/packages/logout/index.js'),
  '@opentiny/tiny-engine-toolbar-media': path.resolve(__dirname, 'src/toolbars/packages/media/index.js'),
  '@opentiny/tiny-engine-toolbar-preview': path.resolve(__dirname, 'src/toolbars/packages/preview/index.js'),
  '@opentiny/tiny-engine-toolbar-generate-vue': path.resolve(__dirname, 'src/toolbars/packages/generate-vue/index.js'),
  '@opentiny/tiny-engine-toolbar-refresh': path.resolve(__dirname, 'src/toolbars/packages/refresh/index.js'),
  '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(__dirname, 'src/toolbars/packages/redoundo/index.js'),
  '@opentiny/tiny-engine-toolbar-clean': path.resolve(__dirname, 'src/toolbars/packages/clean/index.js'),
  '@opentiny/tiny-engine-toolbar-save': path.resolve(__dirname, 'src/toolbars/packages/save/index.js'),
  '@opentiny/tiny-engine-toolbar-setting': path.resolve(__dirname, 'src/toolbars/packages/setting/index.js'),
  '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(
    __dirname,
    'src/toolbars/packages/collaboration/index.js'
  ),
  '@opentiny/tiny-engine-theme-dark': path.resolve(__dirname, 'src/theme/packages/dark/index.less'),
  '@opentiny/tiny-engine-theme-light': path.resolve(__dirname, 'src/theme/packages/light/index.less'),
  '@opentiny/tiny-engine-svgs': path.resolve(__dirname, 'src/svgs/index.js'),
  '@opentiny/tiny-engine-http': path.resolve(__dirname, 'src/http/src/index.js'),
  '@opentiny/tiny-engine-canvas': path.resolve(__dirname, 'src/canvas/src/index.js'),
  '@opentiny/tiny-engine-theme': path.resolve(__dirname, `src/theme/packages/${lowcodeConfig.theme}/index.less`),
  '@opentiny/tiny-engine-utils': path.resolve(__dirname, 'src/utils/src/index.js'),
  '@opentiny/tiny-engine-webcomponent-core': path.resolve(__dirname, 'src/webcomponent/src/lib.js'),
  '@opentiny/tiny-engine-i18n-host': path.resolve(__dirname, 'src/i18n/src/lib.js')
}

const prodAlias = {
  '@opentiny/tiny-engine-theme': path.resolve(
    __dirname,
    `node_modules/@opentiny/tiny-engine-theme-${lowcodeConfig.theme}/dist/style.css`
  )
}

const commonAlias = {
  '@opentiny/tiny-engine-app-addons': path.resolve(__dirname, 'src/app/config/addons.js')
}

const importmap = {
  imports: {
    prettier: `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/standalone.mjs`,
    'prettier/': `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/`,
    'prettier/parser-typescript': `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/parser-typescript.mjs`,
    'prettier/parser-html': `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/parser-html.mjs`,
    'prettier/parser-postcss': `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/parser-postcss.mjs`,
    'prettier/parser-babel': `https://unpkg.com/prettier@${importMapVersions.prettier}/esm/parser-babel.mjs`,

    vue: `https://unpkg.com/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.js`,
    '@opentiny/vue': `https://unpkg.com/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue.mjs`,
    '@opentiny/vue-icon': `https://unpkg.com/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-icon.mjs`,
    '@opentiny/vue-common': `https://unpkg.com/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-common.mjs`,
    '@opentiny/vue-locale': `https://unpkg.com/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-locale.mjs`,
    '@opentiny/vue-design-smb': `https://unpkg.com/@opentiny/vue-design-smb@${importMapVersions.tinyVue}/index.js`
  }
}

const importMapStyles = [`https://unpkg.com/@opentiny/vue-theme@${importMapVersions.tinyVue}/index.css`]

export default defineConfig(({ command, mode }) => {
  const monacoPublicPath = {
    local: 'editor/monaco-workers',
    alpha: '', // 需要填写openTiny的cdn地址
    prod: '' // 需要填写openTiny的cdn地址
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

  Object.assign(config.resolve.alias, commonAlias)
  if (command === 'serve') {
    Object.assign(config.resolve.alias, devAlias)
  } else {
    // command === 'build'
    Object.assign(config.resolve.alias, prodAlias)

    monacoEditorPluginInstance = monacoEditorPlugin({ publicPath: monacoPublicPath[mode] })

    if (mode === 'prod') {
      config.build.minify = true
      config.build.sourcemap = false
    }
  }

  config.plugins.push(monacoEditorPluginInstance, htmlPlugin(mode), importmapPlugin(importmap, importMapStyles))

  return config
})
