// 这里 package.json 格式设置为 js，避免被识别成一个 package
export default (schema) => {
  const packageName = schema?.meta?.name || '@opentiny/tiny-engine-preview-react'

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
      '@opentiny/vue': 'latest',
      '@opentiny/vue-icon': 'latest',
      axios: 'latest',
      'axios-mock-adapter': '^1.19.0',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^6.27.0'
    },
    devDependencies: {
      vite: '^4.3.7'
    }
  }

  return JSON.stringify(res)
}
