// 提供engine主题包的样式定义引入
import './base.less'
import './common.less'
if (import.meta.env.VITE_THEME === 'light') {
  import('./light/light-common.less')
} else {
  import('./dark/dark-common.less')
}
import './component-common.less'
