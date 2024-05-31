// TODO: 抽空 common package 中的 metaComponent
import { MetaComponents } from '@opentiny/tiny-engine-common'
import { addMetaComponents } from '@opentiny/tiny-engine-entry'

/**
 * 注册TinyEngine默认的 metaComponents
 */
export const registerMetaComponents = (metaComponents) => {
  addMetaComponents(Object.entries(MetaComponents).map(([name, component]) => ({ name, component })))
  addMetaComponents(metaComponents)
}
