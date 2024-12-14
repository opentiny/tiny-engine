const path = require('path')
const { rules } = require('../../.eslintrc')

module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [path.join(__dirname, './tsconfig.json') ],
    ecmaVersion: 'latest',
  },
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2015: true,
    node: true
  },
  rules,
  ignorePatterns: ['test/sample/*.vue', '.eslintrc.cjs']
}
