import { MetaComponents } from '@opentiny/tiny-engine-common'
import { addMetaComponents } from '@opentiny/tiny-engine-entry'
// 后续默认 metaComponent 都由这个package  提供，抽空 tiny-engine-common 中的 metacomponent
import * as defaultMetaComponents from '@opentiny/tiny-engine-meta-components'

/**
 * 注册TinyEngine默认的 metaComponents
 */
export const registerMetaComponents = () => {
  const { MetaInput, MetaSelect, ...otherComponents } = MetaComponents

  addMetaComponents(Object.entries(otherComponents).map(([name, component]) => ({ name, component })))
  addMetaComponents(Object.values(defaultMetaComponents))
}
