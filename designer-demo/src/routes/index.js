import { appRoutes } from './app'
import { utilsRoutes } from './utils'
import { i18nRoutes } from './i18n'
import { pageRoutes } from './page'
import { blockRoutes } from './block'

export default [...appRoutes, ...utilsRoutes, ...i18nRoutes, ...pageRoutes, ...blockRoutes]