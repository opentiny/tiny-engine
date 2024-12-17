const path = require('path')
const { rules } = require('../../.eslintrc')

module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    projectService: true,
    project: [path.join(__dirname, './tsconfig.json') ],
    ecmaVersion: 'latest',
  },
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2015: true,
    node: true
  },
  rules: {
    ...rules,
    // 允许 @ts-ignore
    "@typescript-eslint/ban-ts-comment": "off",
    // 允许非空断言
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off"
  },
  ignorePatterns: ['test/sample/*.vue', '.eslintrc.cjs']
}
