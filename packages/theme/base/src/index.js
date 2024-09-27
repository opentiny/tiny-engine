// 提供engine主题包的样式定义引入
import './base.less'
import './common.less'
import { tinyThemeDark } from './dark/dark-common'
import { tinyThemeLight } from './light/light-common'
import './page/base-config-page.less'
import './component-common.less'

export const tinyThemeLightVars = {
  id: 'tiny-theme-light',
  name: 'tinyThemeLight',
  cnName: '',
  data: { ...tinyThemeLight }
}

export const tinyThemeDarkVars = {
  id: 'tiny-theme-dark',
  name: 'tinyThemeDark',
  cnName: '',
  data: { ...tinyThemeDark }
}

export const defaultThemeList = {
  light: tinyThemeLightVars,
  dark: tinyThemeDarkVars
}
