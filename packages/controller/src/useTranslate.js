/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { reactive, ref } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { utils } from '@opentiny/tiny-engine-utils'
import { isVsCodeEnv } from '../js/environments'
import { constants } from '@opentiny/tiny-engine-utils'
import { generateI18n } from '../js/vscodeGenerateFile'
import useResource from './useResource'
import { PROP_DATA_TYPE } from '../utils'
import useCanvas from './useCanvas'

const { HOST_TYPE } = constants
const state = reactive({
  langs: {}
})

const currentLanguage = ref('zh_CN')
const i18nResource = reactive({ messages: {}, locales: [] })
const i18nApi = '/app-center/api/i18n/entries'
const globalParams = {
  host: '',
  host_type: ''
}

const getLangs = () => state.langs

const setLangs = (newLangs = {}) => {
  state.langs = newLangs
}

const removeI18n = (key = []) => {
  if (!key.length) {
    return
  }

  const langs = getLangs()
  key.forEach((element) => {
    delete langs[element]
  })

  useHttp().post(`${i18nApi}/bulk/delete`, {
    ...globalParams,
    key_in: key
  })
}

/**
 *
 * @param {Object} obj 国际化对象
 * @param {Boolean} send  为true时表示需要向后台发起请求进行新增或修改
 * @returns
 */

const ensureI18n = (obj, send) => {
  const { locales } = i18nResource
  const contents = Object.fromEntries(locales.map(({ lang }) => [lang, obj[lang]]))
  const langs = getLangs()
  const key = obj.key || utils.guid()

  if (send) {
    const exist = langs[key]

    globalParams.host &&
      useHttp().post(`${i18nApi}/${exist ? 'update' : 'create'}`, {
        ...globalParams,
        key,
        contents
      })

    locales.forEach((lang) => {
      if (i18nResource[lang]?.[key]) {
        i18nResource[lang][key] = contents[lang]
      }
    })

    // VsCode环境生成本地国际化
    if (isVsCodeEnv) {
      generateI18n({
        key,
        contents
      })
    }
  }

  try {
    const messages = {}
    Object.entries(contents).forEach(([locale, message]) => {
      messages[locale] = {
        [key]: message
      }
    })

    useCanvas().canvasApi.value?.setLocales(messages, true)
  } catch (e) {
    // 不需要处理，有报错的词条会在画布初始化的时候统一调setLocales这个方法
  }

  langs[key] = { key, ...contents, type: PROP_DATA_TYPE.I18N }

  return langs[contents.key]
}

const getI18nData = () => {
  return useHttp().get(i18nApi, {
    params: { ...globalParams, _limit: -1 }
  })
}

const getI18n = async ({ init, local }) => {
  const { resState } = useResource()

  if (local) {
    const locales = resState?.langs?.locales || []
    const messages = {}
    const langs = getLangs()

    if (Array.isArray(locales)) {
      locales.forEach(({ lang }) => {
        messages[lang] = {}

        Object.entries(langs).forEach(([key, message]) => {
          messages[lang][key] = message[lang]
        })
      })
    }

    return { locales, messages }
  } else {
    const i18n = init ? resState.langs : await getI18nData

    return i18n
  }
}

const initI18n = async ({ host, hostType, init, local }) => {
  globalParams.host = host
  const hostTypeVar = 'host_type'
  globalParams[hostTypeVar] = hostType || HOST_TYPE.App

  const { locales = [], messages = {} } = await getI18n({ host, hostType, init, local })

  const langs = locales.map((item) => item.lang)

  const firstLangData = messages[langs[0] || 'zh_CN']

  i18nResource.locales = locales
  i18nResource.messages = messages

  Object.keys(firstLangData || {}).forEach((key) => {
    const i18n = { key }

    langs.forEach((lang) => messages[lang] && Object.assign(i18n, { [lang]: messages[lang][key] }))
    ensureI18n(i18n)
  })
}

const initAppI18n = async (appId) => {
  if (appId) {
    await initI18n({
      host: appId,
      hostType: HOST_TYPE.App
    })
    useCanvas().canvasApi.value?.setLocales(i18nResource.messages)
  }
}

const initBlockI18n = async (blockId) => {
  if (blockId) {
    await initI18n({
      host: blockId,
      hostType: HOST_TYPE.Block
    })
    useCanvas().canvasApi.value?.setLocales(i18nResource.messages)
  }
}

const initBlockLocalI18n = async (langs = {}) => {
  setLangs(langs)
  await initI18n({
    host: '',
    hostType: HOST_TYPE.Block,
    local: true
  })
  useCanvas().canvasApi.value?.setLocales(i18nResource.messages)
}

const format = (str = '', params = {}) => str.replace(/\$\{(.+?)\}/g, (substr, key) => params[key] || '')

const translate = (obj) => {
  const { type, key = utils.guid() } = obj || {}

  if (type === PROP_DATA_TYPE.I18N) {
    const langs = getLangs()
    const i18n = langs[key]
    const langData = i18n || obj

    return format(langData[currentLanguage.value] || langData.key, obj.params)
  }

  return obj
}

const getData = () => i18nResource.messages

const batchCreateI18n = ({ host, hostType }) => {
  if (!host) {
    return
  }

  globalParams.host = host
  globalParams.host_type = hostType

  const { locales } = i18nResource
  const langs = getLangs()

  const entries = Object.entries(langs).map(([key, message]) => ({
    key,
    contents: Object.fromEntries(locales.map(({ lang }) => [lang, message[lang]]))
  }))

  useHttp().post(`${i18nApi}/batch/create`, {
    ...globalParams,
    entries
  })
}

export default () => {
  return {
    i18nResource,
    currentLanguage,
    getLangs,
    setLangs,
    getData,
    translate,
    removeI18n,
    ensureI18n,
    initI18n,
    batchCreateI18n,
    initAppI18n,
    initBlockI18n,
    getI18nData,
    initBlockLocalI18n
  }
}
