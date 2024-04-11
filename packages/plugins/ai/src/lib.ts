import PageCreator from './plugins/page-creator/PageCreator.vue'
import ComponentEditor from './plugins/component-editor/ComponentEditor.vue'
import { sharedApi } from './plugins/shared-api'
import CanvasLive from './CanvasLive.vue'

import './index.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPlugins = (di: any) => {
  sharedApi.di = di
  return {
    PageCreator: {
      id: 'PageCreator',
      title: 'AI page creator',
      icon: PageCreator,
      align: 'bottom'
    },
    ComponentEditor: {
      id: 'ComponentEditor',
      title: 'AI component editor',
      icon: ComponentEditor,
      align: 'bottom'
    }
  }
}

export { getPlugins, CanvasLive }
