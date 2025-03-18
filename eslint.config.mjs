import js from '@eslint/js'
import { configureVueProject, defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

configureVueProject({
  scriptLangs: ['ts', 'js', 'tsx', 'jsx']
})

export default defineConfigWithVueTs(
  {
    ignores: [
      '.vscode',
      'docs',
      '**/dist',
      '**/public',
      '**/package-lock.json',
      '**/node_modules',
      '**/tmp',
      '**/temp',
      'mockServer',
      '**/bin',
      '**/expected',
      '**/output',
      '**/test'
    ]
  },
  {
    files: ['**/*.{js,mjs,jsx,ts,mts,tsx,vue}']
  },
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      'no-eq-null': 'error',
      'no-extra-semi': 'off',
      'no-eval': 'error',
      'space-before-function-paren': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/prefer-import-from-vue': 'off',
      // 允许 @ts-ignore
      '@typescript-eslint/ban-ts-comment': 'off',
      // 允许非空断言
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'none'
        }
      ]
    }
  },
  {
    files: ['scripts/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
)
