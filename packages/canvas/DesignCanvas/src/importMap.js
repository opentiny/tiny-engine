import { VITE_CDN_DOMAIN } from '@opentiny/tiny-engine-common/js/environments'

export function getImportMapData(overrideVersions = {}) {
  const importMapVersions = Object.assign(
    {
      vue: '3.4.23',
      tinyVue: '~3.14',
      vueI18n: '^9.9.0'
    },
    overrideVersions
  )

  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    imports: {
      '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue.mjs`,
      '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-icon.mjs`,
      'element-plus': `${VITE_CDN_DOMAIN}/element-plus@2.4.2/dist/index.full.mjs`,
      '@opentiny/tiny-engine-builtin-component': `${VITE_CDN_DOMAIN}/@opentiny/tiny-engine-builtin-component@^2.0.0/dist/index.mjs`
    },
    importStyles: [
      `${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/index.css`,
      `${VITE_CDN_DOMAIN}/element-plus@2.4.2/dist/index.css`
    ]
  }

  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  const tinyVueRequire = {
    imports: {
      '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-common.mjs`,
      '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-locale.mjs`
    }
  }

  const importMap = {
    imports: {
      vue: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.prod.js`,
      'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n@${importMapVersions.vueI18n}/dist/vue-i18n.esm-browser.js`,
      ...blockRequire.imports,
      ...tinyVueRequire.imports
    }
  }

  const importStyles = [...blockRequire.importStyles]

  return {
    importMap,
    importStyles
  }
}
