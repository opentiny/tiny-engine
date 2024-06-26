import { tinyBaseTheme, concatLightTheme } from './base'

// light-concatLightTheme和dark-concatDarkTheme主题判断
export const tinyEngineTheme = {
  id: 'tiny-engine-theme',
  name: 'Engine',
  cnName: 'Engine',
  data: { ...tinyBaseTheme, ...concatLightTheme }
}
