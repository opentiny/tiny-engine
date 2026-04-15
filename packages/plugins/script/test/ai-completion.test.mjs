import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLowcodeContext } from '../src/ai-completion/builders/lowcodeContextBuilder.js'
import { createSmartPrompt } from '../src/ai-completion/builders/promptBuilder.js'
import { FIMPromptBuilder } from '../src/ai-completion/builders/fimPromptBuilder.js'
import { createLowcodeInstruction } from '../src/ai-completion/prompts/templates.js'
import { cleanCompletion } from '../src/ai-completion/utils/completionUtils.js'
import { detectModelType } from '../src/ai-completion/utils/modelUtils.js'

function createMetadata() {
  return {
    dataSource: [
      {
        name: 'users',
        type: 'list',
        description: 'Load user records',
        options: {
          shouldNotLeak: true
        }
      }
    ],
    utils: [
      {
        name: 'formatDate',
        type: 'function',
        content: {
          type: 'JSFunction',
          value: 'function formatDate(value, pattern) { return value }'
        }
      }
    ],
    bridge: [
      {
        name: 'toast',
        description: 'Show a toast message'
      }
    ],
    globalState: [
      {
        id: 'userStore',
        state: {
          token: '',
          profile: {}
        },
        getters: {
          displayName: {}
        },
        actions: {
          fetchProfile: {}
        }
      }
    ],
    state: {
      keyword: '',
      rows: []
    },
    methods: {
      searchUsers: {
        type: 'JSFunction',
        value: 'function searchUsers(keyword) { return keyword }'
      }
    },
    currentSchema: {
      componentName: 'TinyGrid',
      ref: 'gridRef',
      props: {
        data: {
          type: 'JSExpression'
        },
        pager: true,
        onRowClick: {
          type: 'JSFunction'
        }
      }
    }
  }
}

test('buildLowcodeContext keeps compact runtime facts', () => {
  const context = buildLowcodeContext(createMetadata())

  assert.equal(context.dataSource[0].accessPath, 'this.dataSourceMap.users.load()')
  assert.equal('options' in context.dataSource[0], false)
  assert.equal(context.bridge[0].accessPath, 'this.bridge.toast')
  assert.deepEqual(context.currentSchema.props, ['data', 'pager'])
  assert.deepEqual(context.currentSchema.events, ['onRowClick'])
})

test('buildLowcodeContext prioritizes hinted symbols and reports truncation', () => {
  const metadata = createMetadata()
  metadata.methods = Object.fromEntries(
    Array.from({ length: 24 }, (_, index) => [
      `method${index}`,
      {
        type: 'JSFunction',
        value: `function method${index}(value) { return value }`
      }
    ])
  )
  metadata.methods.searchUsers = {
    type: 'JSFunction',
    value: 'function searchUsers(keyword) { return keyword }'
  }

  const context = buildLowcodeContext(metadata, {
    hintText: 'this.search'
  })

  assert.ok(context.methods.some((item) => item.name === 'searchUsers'))
  assert.ok(context.truncated.methods > 0)
})

test('createLowcodeInstruction uses TinyEngine runtime access paths', () => {
  const instruction = createLowcodeInstruction('javascript', buildLowcodeContext(createMetadata()))

  assert.match(instruction, /this\.dataSourceMap\.users\.load\(\)/)
  assert.match(instruction, /this\.bridge\.toast/)
  assert.match(instruction, /this\.searchUsers\(keyword\)/)
  assert.doesNotMatch(instruction, /this\.dataSource\./)
})

test('FIM prompt no longer injects verbose banner comments', () => {
  const builder = new FIMPromptBuilder({
    FIM: {
      MAX_PREFIX_LINES: 100,
      MAX_SUFFIX_LINES: 50
    }
  })

  const { prefix } = builder.buildFIMComponents('function demo() {\n  [CURSOR]\n}\n', {
    language: 'javascript',
    lowcodeContext: buildLowcodeContext(createMetadata())
  })

  assert.match(prefix, /this\.dataSourceMap\.users\.load\(\)/)
  assert.doesNotMatch(prefix, /AI COMPLETION INSTRUCTIONS/)
  assert.doesNotMatch(prefix, /CODE CONTEXT STARTS BELOW/)
})

test('createSmartPrompt does not treat comment markers inside strings as active comments', () => {
  const { commentStatus, fileContent } = createSmartPrompt({
    textBeforeCursor: 'const text = "/* not a real comment */"\nconst label = `// still string`\n',
    filename: 'page.js'
  })

  assert.equal(commentStatus.isComment, false)
  assert.doesNotMatch(fileContent, /Current Function:/)
})

test('createSmartPrompt only marks an open function scope', () => {
  const { fileContent } = createSmartPrompt({
    textBeforeCursor: 'function helper() {\n  return 1\n}\n\nconst value = ',
    filename: 'page.js'
  })

  assert.doesNotMatch(fileContent, /Current Function: helper/)
})

test('FIM cursor analysis ignores closed scopes and string comment markers', () => {
  const builder = new FIMPromptBuilder({
    FIM: {
      MAX_PREFIX_LINES: 100,
      MAX_SUFFIX_LINES: 50
    }
  })

  const closedScope = builder.analyzeCursorContext('function helper() {\n  return 1\n}\n\nconst value = ', '')
  assert.equal(closedScope.inFunction, false)

  const stringComment = builder.analyzeCursorContext('const text = "/* not a real comment */"\n', '')
  assert.equal(stringComment.inBlockComment, false)
  assert.equal(stringComment.inLineComment, false)
})

test('cleanCompletion trims duplicated suffix overlap', () => {
  const cleaned = cleanCompletion('load()\n}', 'qwen', { needsExpression: false }, '\n}')

  assert.equal(cleaned, 'load()')
})

test('detectModelType only accepts supported FIM models without explicit capability', () => {
  assert.equal(detectModelType('qwen3-coder-flash', { provider: 'bailian' }), 'unknown')
  assert.equal(detectModelType('qwen-coder-turbo-latest', { provider: 'bailian' }), 'qwen')
  assert.equal(
    detectModelType('deepseek-chat', { provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1' }),
    'deepseek'
  )
})
