import { describe, it, expect } from 'vitest'
import { transformReactToDsl } from '../../src'

describe('react-to-dsl basic', () => {
  it('should transform simple jsx', () => {
    const code = `
      export default function App(){
        return <div className="box"><h1 title="t">Hello</h1></div>
      }
    `
    const dsl = transformReactToDsl(code, { filename: 'App.tsx' })
    expect(dsl.pageSchema.length).toBe(1)
    const pageOrFolder = dsl.pageSchema[0]
    if ((pageOrFolder as any).componentName === 'Folder') {
      throw new Error('unexpected Folder in pageSchema')
    }
    const page = pageOrFolder as any
    expect(page.children.length).toBe(1)
    expect(page.children[0].componentName).toBe('div')
    // props.className should be preserved
    expect(page.children[0].props.className).toBe('box')
  })
})
