import { tinyBaseTheme, concatThemeLight, concatThemeDark } from './base'

export const tinyEngineThemeLight = {
  id: 'tiny-engine-light-theme',
  name: 'EngineLightTheme',
  cnName: 'EngineLightTheme',
  data: { ...tinyBaseTheme, ...concatThemeLight }
}

export const tinyEngineThemeDark = {
  id: 'tiny-engine-dark-theme',
  name: 'EngineDarkTheme',
  cnName: 'EngineDarkTheme',
  data: { ...tinyBaseTheme, ...concatThemeDark }
}
