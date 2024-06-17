import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

const config = {
  define: {},
  resolve: {
    alias: {}
  },
  build: {
    cssCodeSplit: false,
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-i18n',
        '@opentiny/tiny-engine-i18n-host',
        '@opentiny/tiny-engine-webcomponent-core',
        '@opentiny/vue',
        '@opentiny/vue-icon'
      ],
      output: {
        globals: {
          vue: 'Vue',
          'vue-i18n': 'VueI18n',
          '@opentiny/tiny-engine-i18n-host': 'TinyI18nHost',
          '@opentiny/tiny-engine-webcomponent-core': 'TinyWebcomponentCore',
          '@opentiny/vue': 'TinyVue',
          '@opentiny/vue-icon': 'TinyVueIcon'
        }
      }
    }
  }
}

export default defineConfig(({ command, mode }) => {
  if (command !== 'build' || mode !== 'block') {
    return config
  }

  const vuePluginConfig = {}
  const styleLinks = ['https://npm.onmicrosoft.cn/@opentiny/vue-theme@3.14/index.css']

  config.publicDir = false

  config.build.lib = {
    entry: path.resolve(__dirname, './src/lib.js'),
    name: 'TinyVueBlock',
    formats: ['umd', 'es'],
    fileName: (format) => `js/web-component.${format}.js`
  }

  vuePluginConfig.customElement = true

  config.plugins = [vue(vuePluginConfig), vueJsx()]

  config.define['process.env'] = {
    VUE_APP_UI_LIB_FULL_STYLE_FILE_URL: styleLinks
  }

  return config
})
