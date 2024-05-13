// 这里 package.json 格式设置为 js，避免被识别成一个 package
export default (schema) => {
  const packageName = schema?.meta?.name || '@opentiny/tiny-engine-preview-vue'

  const res = {
    name: packageName,
    version: '1.0.0',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    main: 'dist/index.js',
    module: 'dist/index.js',
    dependencies: {
      '@opentiny/tiny-engine-i18n-host': '^1.0.0',
      '@opentiny/vue': '^3.10.0',
      '@opentiny/vue-icon': '^3.10.0',
      axios: '^0.21.1',
      'axios-mock-adapter': '^1.19.0',
      vue: '^3.3.9',
      'vue-i18n': '^9.2.0-beta.3',
      'vue-router': '^4.2.5',
      pinia: '^2.1.7'
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^4.5.1',
      '@vitejs/plugin-vue-jsx': '^3.1.0',
      vite: '^4.3.7'
    }
  }

  return JSON.stringify(res)
}
