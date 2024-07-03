import * as allConfigurator from '@opentiny/tiny-engine-configurator'
import { addConfigurator } from '@opentiny/tiny-engine-meta-register'

/**
 * 注册用户指定的 configurators
 */
export const registerConfigurators = (configurators) => {
  addConfigurator(Object.entries(allConfigurator).map(([name, component]) => ({ name, component })))
  addConfigurator(Object.entries(configurators).map(([name, component]) => ({ name, component })))
}
