import { describe, expect, it } from 'vitest'
import { useState, useStore } from '../src/useState'

describe.concurrent('useState Key-based Access', () => {
  it('accesses shared state using a key', () => {
    const [state, setState] = useState('sharedKey')
    expect(state.value).toBeUndefined() // Assuming no initial value set

    setState('new value')
    expect(state.value).toEqual('new value')

    // Simulate another component accessing the same key
    const [state2] = useState('sharedKey')
    expect(state2.value).toEqual('new value')
  })

  it('handles non-existent keys gracefully', () => {
    const [state] = useState('nonExistentKey')
    expect(state.value).toBeUndefined()
  })

  it('ensures state consistency across components', () => {
    const [, setState] = useState('consistentKey')
    setState('consistent value')

    // Simulate another component accessing the same key
    const [state2] = useState('consistentKey')
    expect(state2.value).toEqual('consistent value')
  })
})

describe.concurrent('useStore', () => {
  it('patch store correctly', () => {
    const { store, patchStore } = useStore('foo')

    expect(store).toEqual({})

    patchStore({ hello: 'world', foo: 'bar' })

    expect(store).toEqual({ hello: 'world', foo: 'bar' })

    patchStore({ hello: 'univese' })

    expect(store).toEqual({ hello: 'univese', foo: 'bar' })
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
