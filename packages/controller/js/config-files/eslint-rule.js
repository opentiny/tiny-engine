import eslintRecommended from '@eslint/js/src/configs/eslint-recommended.js'
export default {
  ...eslintRecommended.rules,
  'no-console': 'error',
  'no-debugger': 'error',
  'space-before-function-paren': 'off',
  'no-use-before-define': 'error'
}
