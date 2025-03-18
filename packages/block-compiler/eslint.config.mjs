import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rootConfig from '../../eslint.config.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...rootConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        project: [path.join(__dirname, './tsconfig.json')]
      }
    }
  }
]
