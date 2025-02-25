// @ts-check
import js from '@eslint/js'
import { configureVueProject, defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

configureVueProject({
  tsSyntaxInTemplates: true,
  scriptLangs: ['ts', 'js', 'tsx', 'jsx'],
  rootDir: import.meta.dirname
})

export default defineConfigWithVueTs(
  {
    ignores: [
      '.vscode',
      '**/dist',
      '**/public',
      '**/package-lock.json',
      '**/node_modules/**/*',
      '**/tmp',
      '**/temp',
      'mockServer',
      'packages/vue-generator/**/output/**/*',
      'packages/vue-generator/test/**/*',
      'packages/build/vite-plugin-meta-comments/src/test/code/**/*'
    ]
  },
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
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
      'space-before-function-paren': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json'
      }
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
