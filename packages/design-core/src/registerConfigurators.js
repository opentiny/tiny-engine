// TODO: 抽空 common package 中的 metaComponent
import { MetaComponents } from '@opentiny/tiny-engine-common'
import { addConfigurator } from '@opentiny/tiny-engine-entry'

/**
 * 注册TinyEngine默认的 metaComponents
 */
export const registerConfigurators = (metaComponents) => {
  addConfigurator(Object.entries(MetaComponents).map(([name, component]) => ({ name, component })))
  addConfigurator(metaComponents)
}
