import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLowcodeContext } from '../src/ai-completion/builders/lowcodeContextBuilder.js'
import { FIMPromptBuilder } from '../src/ai-completion/builders/fimPromptBuilder.js'
import { createLowcodeInstruction } from '../src/ai-completion/prompts/templates.js'

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
