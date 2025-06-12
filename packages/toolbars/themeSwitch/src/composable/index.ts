/* metaService: engine.toolbars.themeSwitch.composable-index */
import { reactive, ref } from 'vue'
import { defineService, getMetaApi, getMergeMeta, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { setGlobalMonacoEditorTheme } from '@opentiny/tiny-engine-common'

const THEME_DATA = ref<any[]>([])

let DEFAULT_THEME: any = null

const themeState = reactive({
  theme: '',
  themeLabel: '',
  themeIcon: ''
})

const getThemeData = () => THEME_DATA
const getThemeState = () => themeState

const getTheme = (theme: string) => {
  return THEME_DATA.value.find((item) => theme === item.type) || DEFAULT_THEME
}

const themeChange = (theme: string) => {
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
    THEME_DATA.value = getMergeMeta('engine.config')?.themesList || []
    DEFAULT_THEME = THEME_DATA.value[0]
    const theme =
      localStorage.getItem(`tiny-engine-theme-${appId}`) || getMergeMeta('engine.config').theme || DEFAULT_THEME.type
    themeChange(theme)
  },
  apis: () => ({
    getThemeData,
    getThemeState,
    getTheme,
    themeChange
  })
})
