import i18n from '@opentiny/tiny-engine-i18n-host'
import lowcode from '@/lowcodeConfig/lowcode.js'
import locale from '@/i18n/locale.js'

i18n.lowcode = lowcode
i18n.global.mergeLocaleMessage('en_US', locale.en_US)
i18n.global.mergeLocaleMessage('zh_CN', locale.zh_CN)

export default i18n
