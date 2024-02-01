module.exports = {
  'env': {
    'es2021': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  'overrides': [
    {
      'env': {
        'node': true
      },
      'files': [
        '.eslintrc.{js,cjs}'
      ],
      'parserOptions': {
        'sourceType': 'script'
      }
    }
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    '@typescript-eslint'
  ],
  'rules': {
    // 'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-dupe-args': 2,
    'no-dupe-keys': 2,
    'no-duplicate-case': 2,
    'no-empty': 1,
    'no-extra-semi': 2,
    'no-regex-spaces': 1,
    'no-unsafe-negation': 2,
    'curly': 2,
    'dot-location': ['error', 'property'],
    'eqeqeq': 2,
    'no-else-return': 2,
    'no-extra-label': 2,
    'no-multi-spaces': 2,
    'no-useless-return': 2,
    'yoda': 2,
    'no-undef-init': 2,
    'lines-around-comment': 2,
    'lines-between-class-members': 2,
    'max-len': ['error', { code: 180 }],
    'no-mixed-spaces-and-tabs': 2,
    'no-multiple-empty-lines': 2,
    'space-before-blocks': 2,
    'arrow-spacing': 2,
    'no-const-assign': 2,
    'no-var': 2,
    'prefer-const': 2,
    'prefer-arrow-callback': 1,
    'prefer-destructuring': 1,
    'prefer-template': 1,
    'array-bracket-spacing': 2,
    'comma-spacing': ['error', { after: true, before: false }],
    'complexity': 2,
    'consistent-return': 2,
    'no-self-assign': 1,
    'block-spacing': 1,
    'object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
