import { concatThemeDark } from './dark-component.js'
import { concatThemeLight } from './light-component.js'

export const tinyEngineThemeLight = {
  id: 'tiny-engine-light-theme',
  name: 'EngineLightTheme',
  cnName: 'EngineLightTheme',
  data: { ...concatThemeLight }
}

export const tinyEngineThemeDark = {
  id: 'tiny-engine-dark-theme',
  name: 'EngineDarkTheme',
  cnName: 'EngineDarkTheme',
  data: { ...concatThemeDark }
}
