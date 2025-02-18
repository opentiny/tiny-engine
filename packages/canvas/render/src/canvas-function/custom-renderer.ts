import { h } from 'vue'
import CanvasEmpty from './CanvasEmpty.vue'
import renderer from '../render'

function defaultRenderer(schema, refreshKey, entry, active, isPage = true) {
  // 渲染画布增加根节点，与出码和预览保持一致
  const rootChildrenSchema = {
    id: 0,
    componentName: 'div',
    componentType: 'PageSection',
    // 手动添加一个唯一的属性，后续在画布选中此节点时方便处理额外的逻辑。由于没有修改schema，不会影响出码
    props: { ...schema.props, 'data-id': 'root-container', 'data-page-active': active },
    children: schema.children
  }

  if (!entry) {
    return schema.children?.length || !active
      ? h(renderer, { schema: rootChildrenSchema, parent: schema })
      : [h(CanvasEmpty)]
  }

  const PageStartSchema = {
    componentName: 'div',
    componentType: 'PageStart',
    props: { 'data-id': 'root-container' }
  }

  return h(
    // TODO: 这里顶层的 i18n-host 在不支持 webComponent 的区块之后，应该也不需要webComponent 的 i18n provider 了
    'tiny-i18n-host',
    {
      locale: 'zh_CN',
      key: refreshKey.value,
      ref: 'page',
      className: 'design-page'
    },
    isPage
      ? h(renderer, { schema: PageStartSchema, parent: schema })
      : schema.children?.length
      ? h(renderer, { schema: rootChildrenSchema, parent: schema })
      : [h(CanvasEmpty)]
  )
}

export function useCustomRenderer() {
  let canvasRenderer = null

  const getRenderer = () => canvasRenderer || defaultRenderer
  const setRenderer = (fn) => {
    canvasRenderer = fn
  }

  return {
    getRenderer,
    setRenderer
  }
}
