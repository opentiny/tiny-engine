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

import { pageService } from '../routes/main-routes'
import { getResponseData } from '../tool/Common'
export default class AppService {
  async lock(query) {
    const { id, state } = query
    const occupier = state === 'occupy' ? pageService.userInfo : null
    await pageService.update(id, { occupier })
    return getResponseData({
      operate: 'success',
      occupier
    })
  }

  // 获取应用预览数据
  getAppPreviewMetaData() {
    const appMetaData = require('./appinfo.json')

    const { i18n: i18nEntries, source = [], extension = [], app } = appMetaData
    // 拼装数据源
    const dataSource = {
      list: source,
      dataHandler: app.data_handler
    }
    // 拼装工具类
    const utils = []
    extension.forEach((item) => {
      const { name, type, content, category } = item
      const data = { name, type, content }
      if (category === 'utils') {
        utils.push(data)
      }
    })
    // 拼装国际化词条
    const entriesData = getResponseData(i18nEntries)
    const i18n = this.formatI18nEntrites(entriesData)
    return getResponseData({
      dataSource,
      globalState: app.global_state,
      utils,
      i18n
    })
  }

  formatI18nEntrites(entriesData) {
    const entries = entriesData.data
    // 中文和英文作为全局国际化语言，并没有和应用/区块建立关联关系
    const defaultLang = [{ lang: 'en_US' }, { lang: 'zh_CN' }]

    const res = {}
    entries.forEach((entry) => {
      const {
        key,
        lang: { lang },
        content
      } = entry
      res[lang] = res[lang] || {}
      res[lang][key] = content
    })
    return res
  }
}
