import i18n, { i18nKeyMaps } from '../js/i18n'

import enUs from './en-us.json'
import zhCn from './zh-cn.json'

const { mergeLocaleMessage } = i18n.global

mergeLocaleMessage(i18nKeyMaps.enUS, enUs)
mergeLocaleMessage(i18nKeyMaps.zhCN, zhCn)
