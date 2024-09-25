// 提供engine主题包的样式定义引入
import './page/base-config-page.less'
import './base.less'
import './common.less'
import { tinyDarkTheme } from './dark/dark-common'
import { tinyLightTheme } from './light/light-common'
import './component-common.less'

export const tinyThemeLightVars = {
  id: 'tiny-light-theme',
  name: 'tinyLightTheme',
  cnName: '',
  data: { ...tinyLightTheme }
}

export const tinyThemeDarkVars = {
  id: 'tiny-dark-theme',
  name: 'tinyDarkTheme',
  cnName: '',
  data: { ...tinyDarkTheme }
}

export const defaultThemeList = {
  light: tinyThemeLightVars,
  dark: tinyThemeDarkVars
}
