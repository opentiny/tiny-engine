// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick, type App } from 'vue'

describe('image message renderer', () => {
  let app: App
  let container: HTMLDivElement
  let createImageMessageApp: typeof import('./fixtures/image-message').createImageMessageApp
  let createRendererApp: typeof import('./fixtures/image-message').createRendererApp
  let createLegacyImageApp: typeof import('./fixtures/image-message').createLegacyImageApp
  const script = document.createElement('script')

  beforeAll(async () => {
    // The UI entry point initializes icon and canvas modules in a browser document.
    document.head.appendChild(script)
    // Layout observation is a browser boundary that jsdom does not implement.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getImageData: () => ({ data: [] }),
      fillText() {},
      measureText: () => ({ width: 0 })
    } as unknown as CanvasRenderingContext2D)
    // Complete image network loads without making requests from jsdom.
    vi.stubGlobal(
      'Image',
      class {
        width = 200
        height = 120
        onload?: (event: Event) => void
        setAttribute() {}
        set src(_url: string) {
          queueMicrotask(() => this.onload?.(new Event('load')))
        }
      }
    )
    ;({ createImageMessageApp, createRendererApp, createLegacyImageApp } = await import('./fixtures/image-message'))
  })

  afterAll(() => {
    script.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    app?.unmount()
    container?.remove()
  })

  async function flushImage() {
    await nextTick()
    await nextTick()
  }

  async function mount(imageApp: App) {
    container = document.createElement('div')
    document.body.appendChild(container)
    app = imageApp
    app.mount(container)
    await flushImage()
  }

  const image = () => container.querySelector<HTMLImageElement>('.tiny-image__inner')

  it('renders and previews an image following a text item through the bubble content resolver', async () => {
    await mount(createImageMessageApp('https://example.test/first.png'))

    expect(image()?.getAttribute('src')).toBe('https://example.test/first.png')
    image()?.click()
    await nextTick()
    expect(document.querySelector('.tiny-image-viewer__img')?.getAttribute('src')).toBe(
      'https://example.test/first.png'
    )
  })

  it('updates the image when the message and content index change without remounting', async () => {
    const fixture = createRendererApp({ renderContent: [{ type: 'img', content: 'https://example.test/first.png' }] })
    await mount(fixture.app)
    const renderer = container.querySelector('.img-renderer-container')
    expect(image()?.getAttribute('src')).toBe('https://example.test/first.png')

    fixture.props.message = {
      renderContent: [
        { type: 'img', content: 'https://example.test/second.png' },
        { type: 'img', content: 'https://example.test/third.png' }
      ]
    }
    await flushImage()
    expect(image()?.getAttribute('src')).toBe('https://example.test/second.png')

    fixture.props.contentIndex = 1
    await flushImage()
    expect(image()?.getAttribute('src')).toBe('https://example.test/third.png')
    expect(container.querySelector('.img-renderer-container')).toBe(renderer)
  })

  it.each([
    [[], 0],
    [[{ type: 'img', content: '' }], 0],
    [[{ type: 'img' }], 0],
    [[{ type: 'img', content: 'https://example.test/first.png' }], 1]
  ])('does not render an image for an empty or missing content item (%j, %i)', async (renderContent, contentIndex) => {
    await mount(createRendererApp({ renderContent }, contentIndex).app)
    expect(container.querySelector('.img-renderer-container')).toBeNull()
  })

  it('supports the existing content prop without a bubble provider', async () => {
    await mount(createLegacyImageApp('https://example.test/legacy.png'))
    expect(image()?.getAttribute('src')).toBe('https://example.test/legacy.png')
  })

  it('keeps an explicit content prop ahead of the resolved message content', async () => {
    await mount(
      createRendererApp(
        { renderContent: [{ type: 'img', content: 'https://example.test/message.png' }] },
        0,
        'https://example.test/legacy.png'
      ).app
    )
    expect(image()?.getAttribute('src')).toBe('https://example.test/legacy.png')
  })

  it('removes a previously rendered image when its content becomes empty', async () => {
    const fixture = createRendererApp({ renderContent: [{ type: 'img', content: 'https://example.test/first.png' }] })
    await mount(fixture.app)
    expect(image()).not.toBeNull()
    fixture.props.message = { renderContent: [] }
    await flushImage()
    expect(container.querySelector('.img-renderer-container')).toBeNull()
  })
})
