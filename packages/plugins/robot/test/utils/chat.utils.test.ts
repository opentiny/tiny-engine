import { describe, expect, it, vi } from 'vitest'
import {
  addSystemPrompt,
  extractMessageText,
  formatMessages,
  mergeStringFields,
  processSSEStream,
  removeLoading,
  serializeError
} from '../../src/utils/chat.utils'

describe('chat utils', () => {
  describe('formatMessages', () => {
    it('filters out completely empty messages', () => {
      const result = formatMessages([
        { role: 'user', content: '' },
        { role: 'assistant', content: 'hello' }
      ] as any)

      expect(result).toEqual([{ role: 'assistant', content: 'hello' }])
    })

    it('keeps messages that only contain tool calls', () => {
      const result = formatMessages([
        {
          role: 'assistant',
          content: '',
          tool_calls: [{ id: 'tool-1', type: 'function' }]
        }
      ] as any)

      expect(result).toEqual([
        {
          role: 'assistant',
          content: '',
          tool_calls: [{ id: 'tool-1', type: 'function' }]
        }
      ])
    })

    it('keeps messages that only contain tool_call_id', () => {
      const result = formatMessages([
        {
          role: 'tool',
          content: '',
          tool_call_id: 'tool-1'
        }
      ] as any)

      expect(result).toEqual([
        {
          role: 'tool',
          content: '',
          tool_call_id: 'tool-1'
        }
      ])
    })

    it('preserves multimodal content arrays', () => {
      const content = [
        { type: 'text', text: '请对比图片差异' },
        { type: 'image_url', image_url: { url: 'https://example.com/1.png' } }
      ]

      const result = formatMessages([
        {
          role: 'user',
          content
        }
      ] as any)

      expect(result).toEqual([
        {
          role: 'user',
          content
        }
      ])
    })

    it('preserves reasoning_content when present', () => {
      const result = formatMessages([
        {
          role: 'assistant',
          content: 'answer',
          reasoning_content: 'thoughts'
        }
      ] as any)

      expect(result).toEqual([
        {
          role: 'assistant',
          content: 'answer',
          reasoning_content: 'thoughts'
        }
      ])
    })

    it('keeps tool fields together with normal content', () => {
      const result = formatMessages([
        {
          role: 'assistant',
          content: 'tool output',
          tool_calls: [{ id: 'tool-1' }],
          reasoning_content: 'internal'
        }
      ] as any)

      expect(result[0]).toEqual({
        role: 'assistant',
        content: 'tool output',
        tool_calls: [{ id: 'tool-1' }],
        reasoning_content: 'internal'
      })
    })
  })

  describe('serializeError', () => {
    it('returns an empty string for undefined and null', () => {
      expect(serializeError(undefined)).toBe('')
      expect(serializeError(null)).toBe('')
    })

    it('serializes Error instances into structured json strings', () => {
      expect(serializeError(new TypeError('boom'))).toBe('{"name":"TypeError","message":"boom"}')
    })

    it('returns plain strings unchanged', () => {
      expect(serializeError('plain text')).toBe('plain text')
    })

    it('json-stringifies ordinary objects', () => {
      expect(serializeError({ code: 500, message: 'fail' })).toBe('{"code":500,"message":"fail"}')
    })

    it('falls back to String() for non-json-serializable values', () => {
      const value = 1n

      expect(serializeError(value)).toBe('1')
    })
  })

  describe('extractMessageText', () => {
    it('returns plain string content as-is', () => {
      expect(extractMessageText('hello')).toBe('hello')
    })

    it('joins text items from mixed content arrays', () => {
      const result = extractMessageText([
        'line 1',
        { type: 'text', text: 'line 2' },
        { type: 'text', content: 'line 3' },
        { type: 'image_url', image_url: { url: 'https://example.com/a.png' } }
      ])

      expect(result).toBe('line 1\nline 2\nline 3')
    })

    it('returns an empty string for unsupported content', () => {
      expect(extractMessageText({ foo: 'bar' })).toBe('')
    })
  })

  describe('mergeStringFields', () => {
    it('concatenates sibling string fields', () => {
      const result = mergeStringFields(
        {
          content: 'hello',
          title: 'foo'
        },
        {
          content: ' world',
          title: ' bar'
        }
      )

      expect(result).toEqual({
        content: 'hello world',
        title: 'foo bar'
      })
    })

    it('recursively merges nested object fields', () => {
      const result = mergeStringFields(
        {
          delta: {
            content: 'hello',
            metadata: {
              reason: 'a'
            }
          }
        },
        {
          delta: {
            content: ' world',
            metadata: {
              reason: 'b'
            }
          }
        }
      )

      expect(result).toEqual({
        delta: {
          content: 'hello world',
          metadata: {
            reason: 'ab'
          }
        }
      })
    })

    it('copies missing fields from the source object', () => {
      const result = mergeStringFields(
        {
          delta: {
            content: 'hello'
          }
        },
        {
          delta: {
            role: 'assistant'
          },
          finish_reason: 'stop'
        }
      )

      expect(result).toEqual({
        delta: {
          content: 'hello',
          role: 'assistant'
        },
        finish_reason: 'stop'
      })
    })

    it('overwrites falsy non-string values and recursively merges nested objects', () => {
      const result = mergeStringFields(
        {
          index: 0,
          done: false,
          meta: {
            step: 'a'
          }
        },
        {
          index: 1,
          done: true,
          meta: {
            step: 'b'
          }
        }
      )

      expect(result).toEqual({
        index: 1,
        done: true,
        meta: {
          step: 'ab'
        }
      })
    })
  })

  describe('processSSEStream', () => {
    it('parses standard SSE chunks and forwards them to the handler', () => {
      const handler = {
        onData: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn()
      }
      const data = [
        'data: {"choices":[{"delta":{"content":"hello"},"finish_reason":null}]}',
        '',
        'data: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop"}]}',
        '',
        'data: [DONE]',
        ''
      ].join('\n\n')

      processSSEStream(data, handler as any)

      expect(handler.onData).toHaveBeenCalledTimes(2)
      expect(handler.onDone).toHaveBeenCalledWith('stop')
    })

    it('uses the latest finish reason before DONE', () => {
      const handler = {
        onData: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn()
      }
      const data = [
        'data: {"choices":[{"delta":{"content":"a"},"finish_reason":null}]}',
        '',
        'data: {"choices":[{"delta":{"content":"b"},"finish_reason":"tool_calls"}]}',
        '',
        'data: [DONE]',
        ''
      ].join('\n\n')

      processSSEStream(data, handler as any)

      expect(handler.onDone).toHaveBeenCalledWith('tool_calls')
    })

    it('ignores blank segments and malformed lines that do not start with data', () => {
      const handler = {
        onData: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn()
      }
      const data = ['event: ping', '', 'data: [DONE]', ''].join('\n\n')

      processSSEStream(data, handler as any)

      expect(handler.onData).not.toHaveBeenCalled()
      expect(handler.onDone).toHaveBeenCalledWith(undefined)
    })

    it('swallows JSON parse errors and continues parsing later chunks', () => {
      const handler = {
        onData: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn()
      }
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const data = [
        'data: {"choices":[{"delta":{"content":"ok"},"finish_reason":null}]}',
        '',
        'data: {"choices":',
        '',
        'data: {"choices":[{"delta":{"content":"still ok"},"finish_reason":"stop"}]}',
        '',
        'data: [DONE]',
        ''
      ].join('\n\n')

      processSSEStream(data, handler as any)

      expect(handler.onData).toHaveBeenCalledTimes(2)
      expect(handler.onDone).toHaveBeenCalledWith('stop')
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('removeLoading', () => {
    it('removes the last loading item by default', () => {
      const messages = [
        {
          renderContent: [
            { type: 'text', content: 'hello' },
            { type: 'loading', content: '' },
            { type: 'agent-loading', content: '' }
          ]
        }
      ]

      removeLoading(messages as any)

      expect(messages[0].renderContent).toEqual([
        { type: 'text', content: 'hello' },
        { type: 'loading', content: '' }
      ])
    })

    it('removes the last loading item that matches the provided name', () => {
      const messages = [
        {
          renderContent: [
            { type: 'loading', content: 'tool-a' },
            { type: 'loading', content: 'tool-b' },
            { type: 'loading', content: 'tool-a' }
          ]
        }
      ]

      removeLoading(messages as any, 'tool-a')

      expect(messages[0].renderContent).toEqual([
        { type: 'loading', content: 'tool-a' },
        { type: 'loading', content: 'tool-b' }
      ])
    })

    it('does nothing when there is no renderContent', () => {
      const messages = [{}]

      expect(() => removeLoading(messages as any)).not.toThrow()
      expect(messages).toEqual([{}])
    })

    it('does nothing when no loading item matches the provided name', () => {
      const messages = [
        {
          renderContent: [
            { type: 'text', content: 'hello' },
            { type: 'loading', content: 'tool-a' }
          ]
        }
      ]

      removeLoading(messages as any, 'tool-b')

      expect(messages[0].renderContent).toEqual([
        { type: 'text', content: 'hello' },
        { type: 'loading', content: 'tool-a' }
      ])
    })
  })

  describe('addSystemPrompt', () => {
    it('adds a system prompt when the message list is empty', () => {
      const messages: any[] = []

      addSystemPrompt(messages, '你是一个助手')

      expect(messages).toEqual([{ role: 'system', content: '你是一个助手' }])
    })

    it('prepends a system prompt when the first message is not system', () => {
      const messages = [{ role: 'user', content: 'hello' }]

      addSystemPrompt(messages as any, '你是一个助手')

      expect(messages).toEqual([
        { role: 'system', content: '你是一个助手' },
        { role: 'user', content: 'hello' }
      ])
    })

    it('updates the existing system prompt when content has changed', () => {
      const messages = [
        { role: 'system', content: '旧提示词' },
        { role: 'user', content: 'hello' }
      ]

      addSystemPrompt(messages as any, '新提示词')

      expect(messages[0]).toEqual({ role: 'system', content: '新提示词' })
    })

    it('keeps the existing system prompt when it already matches', () => {
      const messages = [
        { role: 'system', content: '固定提示词' },
        { role: 'user', content: 'hello' }
      ]

      addSystemPrompt(messages as any, '固定提示词')

      expect(messages).toEqual([
        { role: 'system', content: '固定提示词' },
        { role: 'user', content: 'hello' }
      ])
    })
  })
})
