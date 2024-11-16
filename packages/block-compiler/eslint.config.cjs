
const { rules } = require('../../.eslintrc')

module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    ecmaVersion: 'latest',
  },
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2015: true,
    node: true
  },
  rules: [...rules]
}
