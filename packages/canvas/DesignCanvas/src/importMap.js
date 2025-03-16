import { VITE_CDN_DOMAIN, VITE_CDN_TYPE } from '@opentiny/tiny-engine-common/js/environments'

export function getImportMapData(overrideVersions = {}, canvasDeps = { scripts: [], styles: [] }) {
  const importMapVersions = Object.assign(
    {
      vue: '3.4.23',
      tinyVue: '~3.20',
      vueI18n: '^9.9.0'
    },
    overrideVersions
  )

  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' ? '/files' : ''

  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    imports: {
      '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue-runtime${versionDelimiter}${importMapVersions.tinyVue}${fileDelimiter}/dist3/tiny-vue-pc.mjs`,
      '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue-runtime${versionDelimiter}${importMapVersions.tinyVue}${fileDelimiter}/dist3/tiny-vue-icon.mjs`,
      'element-plus': `${VITE_CDN_DOMAIN}/element-plus${versionDelimiter}2.4.2${fileDelimiter}/dist/index.full.mjs`,
      '@opentiny/tiny-engine-builtin-component': `${VITE_CDN_DOMAIN}/@opentiny/tiny-engine-builtin-component${versionDelimiter}^2.0.0${fileDelimiter}/dist/index.mjs`
    },
    importStyles: [
      `${VITE_CDN_DOMAIN}/@opentiny/vue-theme${versionDelimiter}${importMapVersions.tinyVue}${fileDelimiter}/index.css`,
      `${VITE_CDN_DOMAIN}/element-plus${versionDelimiter}2.4.2${fileDelimiter}/dist/index.css`
    ]
  }

  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  const tinyVueRequire = {
    imports: {
      '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue-runtime${versionDelimiter}${importMapVersions.tinyVue}${fileDelimiter}/dist3/tiny-vue-common.mjs`,
      '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue-runtime${versionDelimiter}${importMapVersions.tinyVue}${fileDelimiter}/dist3/tiny-vue-locale.mjs`,
      echarts: `${VITE_CDN_DOMAIN}/echarts${versionDelimiter}5.4.1${fileDelimiter}/dist/echarts.esm.js`
    }
  }

  const materialsAndUtilsRequire = canvasDeps.scripts.reduce((imports, { package: pkg, script }) => {
    if (pkg && script) {
      imports[pkg] = script
    }

    return imports
  }, {})

  const importMap = {
    imports: {
      vue: `${VITE_CDN_DOMAIN}/vue${versionDelimiter}${importMapVersions.vue}${fileDelimiter}/dist/vue.runtime.esm-browser.prod.js`,
      'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n${versionDelimiter}${importMapVersions.vueI18n}${fileDelimiter}/dist/vue-i18n.esm-browser.js`,
      ...blockRequire.imports,
      ...tinyVueRequire.imports,
      ...materialsAndUtilsRequire
    }
  }

  const importStyles = [...blockRequire.importStyles, ...canvasDeps.styles]

  return {
    importMap,
    importStyles
  }
}
