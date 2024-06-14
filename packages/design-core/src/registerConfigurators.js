import * as allConfigurator from '@opentiny/tiny-engine-configurator'
// TODO: 抽空 common package 中的 metaComponent
import { MetaComponents } from '@opentiny/tiny-engine-common'
import { addConfigurator } from '@opentiny/tiny-engine-entry'

/**
 * 注册用户指定的 configurators
 */
export const registerConfigurators = (configurators) => {
  addConfigurator(Object.entries(MetaComponents).map(([name, component]) => ({ name, component })))
  addConfigurator(Object.entries(allConfigurator).map(([name, component]) => ({ name, component })))
  addConfigurator(Object.entries(configurators).map(([name, component]) => ({ name, component })))
}
