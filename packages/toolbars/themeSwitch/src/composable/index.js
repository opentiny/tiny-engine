import { reactive, ref } from 'vue'
import {
  defineService,
  getMetaApi,
  getMergeMeta,
  META_SERVICE,
  getMergeRegistry
} from '@opentiny/tiny-engine-meta-register'
import { setGlobalMonacoEditorTheme } from '@opentiny/tiny-engine-common'

let THEME_DATA = ref([])

let DEFAULT_THEME = null

const themeState = reactive({})

const getThemeData = () => THEME_DATA
const getThemeState = () => themeState

const getTheme = (theme) => {
  return THEME_DATA.value.find((item) => theme === item.type) || DEFAULT_THEME
}

const themeChange = (theme) => {
  themeState.theme = getTheme(theme).type
  themeState.themeLabel = getTheme(themeState.theme).text
  themeState.themeIcon = getTheme(themeState.theme).icon
  document.documentElement.setAttribute('data-theme', themeState.theme)

  const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
  const editorTheme = themeState.theme?.includes('dark') ? 'vs-dark' : 'vs'
  localStorage.setItem(`tiny-engine-theme-${appId}`, themeState.theme)
  setGlobalMonacoEditorTheme(editorTheme)
}

export default defineService({
  id: META_SERVICE.ThemeSwitch,
  type: 'MetaService',
  init: () => {
    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    const theme =
      localStorage.getItem(`tiny-engine-theme-${appId}`) || getMergeMeta('engine.config').theme || DEFAULT_THEME.type
    THEME_DATA.value = getMergeRegistry('themes')
    DEFAULT_THEME = THEME_DATA.value[0]
    themeState.value = {
      theme: DEFAULT_THEME.type,
      themeIcon: DEFAULT_THEME.icon,
      themeLabel: DEFAULT_THEME.text
    }

    themeChange(theme)
  },
  apis: () => ({
    getThemeData,
    getThemeState,
    getTheme,
    themeChange
  })
})
