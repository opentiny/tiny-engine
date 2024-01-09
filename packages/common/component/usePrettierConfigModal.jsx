import { ref, defineAsyncComponent } from 'vue'
import { useModal } from '@opentiny/tiny-engine-controller'
const VueMonaco = defineAsyncComponent(() => import('./VueMonaco.vue'))

const PRETTIER_PREFIX = 'prettier-config-language-'
const jsTsSharedConfig = {
  printWidth: 120,
  singleQuote: true,
  semi: false,
  trailingComma: 'none',
}

export const prettierDefaultConfigMap = {
  'common': {...jsTsSharedConfig},
  'javascript': {...jsTsSharedConfig},
  'typescript': {...jsTsSharedConfig},
  'json': {
    trailingComma: 'es5',
    tabWidth: 2,
    semi: false,
    singleQuote: true,
  },
  'html': {},
  'css': {}
}

function jsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}
export function getPrettierLanguageConfig(language) {
  return jsonParse(localStorage.getItem(PRETTIER_PREFIX + language))
}

export function setPrettierLanguageConfig(language, config) {
  return localStorage.setItem(PRETTIER_PREFIX + language, JSON.stringify(config))
}

export function usePrettierConfigModal(language) {
  const config = ref({
    ...(prettierDefaultConfigMap[language] || {}),
    ...getPrettierLanguageConfig(language || 'other')
  })
  const { message } = useModal();
  const edit = (save) => {
    const configString = ref(JSON.stringify(config.value, null, 2))
    message({
      title: `编辑${language ? ( language === 'common' ? '通用' : ` ${language} 语言的`) : ''} Prettier 配置`,
      message: () => (<VueMonaco value={configString.value} language={'json'} onChange={
        (v) => {
          configString.value = v
        }
      } style='height: 60vh'></VueMonaco>),
      exec: () => {
        config.value = jsonParse(configString.value)
        setPrettierLanguageConfig(language || 'other', config.value)
        save?.(config.value)
      },
      width: 800
    })
  }
  
  return {
    config,
    edit
  }
}
