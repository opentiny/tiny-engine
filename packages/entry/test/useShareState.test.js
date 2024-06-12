import { describe, expect, it } from 'vitest'
import { useShareState, useStore } from '../src/useShareState'

describe.concurrent('useShareState', () => {
  it('use share state correctly', () => {
    const [state, setState] = useShareState('state')

    setState('hello world')

    expect(state.value).toEqual('hello world')

    setState({ hello: 'world' })

    expect(state.value).toEqual({ hello: 'world' })

    setState(['hello', 'world'])

    expect(state.value).toEqual(['hello', 'world'])
  })

  it('patch store correctly', () => {
    const { store, patchStore } = useStore('foo')

    expect(store).toEqual({})

    patchStore({ hello: 'world', foo: 'bar' })

    expect(store).toEqual({ hello: 'world', foo: 'bar' })

    patchStore({ hello: 'univese' })

    expect(store).toEqual({ hello: 'univese', foo: 'bar' })
  })

  it('transform object to array correctly', () => {
    const { patchStore, toArrayOfObjects } = useStore('bar')

    patchStore({
      item1: { hello: 'world' },
      item2: { foo: 'bar' }
    })

    const arr = toArrayOfObjects()

    expect(arr).toEqual([
      { id: 'item1', hello: 'world' },
      { id: 'item2', foo: 'bar' }
    ])
  })

  it('patch store and set state correctly', () => {
    const { store, patchStore, useState } = useStore('hello')

    patchStore({ hello: 'world' })

    const [state, setState] = useState('hello')

    expect(state.value).toEqual('world')

    setState('world 2')

    expect(state.value).toEqual('world 2')
    expect(store).toEqual({ hello: 'world 2' })

    patchStore({ hello: 'world 3' })

    expect(state.value).toEqual('world 3')
    expect(store).toEqual({ hello: 'world 3' })
  })
})
