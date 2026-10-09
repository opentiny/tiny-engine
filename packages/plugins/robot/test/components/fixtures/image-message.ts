import { createApp, h, reactive } from 'vue'
import { BubbleRendererMatchPriority, TrBubbleList, TrBubbleProvider } from '@opentiny/tiny-robot'
import ImgRenderer from '../../../src/components/renderers/ImgRenderer.vue'

export function createImageMessageApp(url: string) {
  const message = {
    role: 'user',
    content: 'Describe this image',
    renderContent: [
      { type: 'text', text: 'Describe this image' },
      { type: 'img', content: url }
    ]
  }

  return createApp({
    render: () =>
      h(
        TrBubbleProvider,
        {
          contentRendererMatches: [
            {
              priority: BubbleRendererMatchPriority.NORMAL,
              find: (_message, content) => content?.type === 'img',
              renderer: ImgRenderer
            }
          ]
        },
        {
          default: () =>
            h(TrBubbleList, {
              messages: [message],
              contentResolver: (current) => current.renderContent,
              autoScroll: false
            })
        }
      )
  })
}

export function createRendererApp(message?: Record<string, unknown>, contentIndex = 0, content = '') {
  const props = reactive({ message, contentIndex, content })
  const app = createApp({
    render: () =>
      h(
        TrBubbleList,
        {
          messages: [{ role: 'user', content: '', renderContent: [] }],
          contentResolver: (current) => current.renderContent,
          autoScroll: false
        },
        { after: () => h(ImgRenderer, props) }
      )
  })
  return { app, props }
}

export function createLegacyImageApp(content: string) {
  return createApp(ImgRenderer, { content })
}
