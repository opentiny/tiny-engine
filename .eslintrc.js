module.exports = {
  env: {
    browser: true,
    es2015: true,
    worker: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-essential'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      parserOpts: {
        plugins: ['jsx']
      }
    }
  },
  plugins: ['vue'],
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
    'space-before-function-paren': 'off',
    'vue/multi-word-component-names': 'off',
    'no-use-before-define': 'error',
    'no-unused-vars': ['error', { ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' }]
  }
}
