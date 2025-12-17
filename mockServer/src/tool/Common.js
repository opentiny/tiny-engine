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

import path from 'path'

// 截取字符串，多余的部分用...代替
export const setString = (str, len) => {
  let StrLen = 0
  let s = ''
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 128) {
      StrLen += 2
    } else {
      StrLen++
    }
    s += str.charAt(i)
    if (StrLen >= len) {
      return s + '...'
    }
  }
  return s
}

// 格式化设置
export const OptionFormat = (GetOptions) => {
  let options = '{'
  for (let n = 0; n < GetOptions.length; n++) {
    options = options + "'" + GetOptions[n].option_name + "':'" + GetOptions[n].option_value + "'"
    if (n < GetOptions.length - 1) {
      options = options + ','
    }
  }
  return JSON.parse(options + '}')
}

// 数组去重
export const HovercUnique = (arr) => {
  const n = {}
  const r = []
  for (let i = 0; i < arr.length; i++) {
    if (!n[arr[i]]) {
      n[arr[i]] = true
      r.push(arr[i])
    }
  }
  return r
}

// 获取json长度
export const getJsonLength = (jsonData) => {
  return Object.keys(jsonData).length
}

export const getResponseData = (data, error) => {
  const res = {
    data
  }

  if (error) {
    const err_code = error.code
    res.error = {
      code: err_code,
      message: error.message
    }
  }
  return res
}

// 获取数据库路径
export const getDatabasePath = (fileName) => {
  const databasePath = process.env.DATABASE_PATH || path.resolve(__dirname, '../database')
  return path.resolve(databasePath, fileName)
}

export const transformI18nMock = (sourceData, startId = 123) => {
  /**
   * 生成随机日期字符串 (ISO 格式)
   * @returns {string} e.g., "2023-05-15T00:48:10.000Z"
   */
  const getRandomDate = () => {
    const start = new Date(2022, 0, 1)
    const end = new Date()
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    return date.toISOString()
  }

  /**
   * 转换 i18n 数据为 Mock 列表格式
   * @param {Object} sourceData - 原始 i18n 对象
   * @param {number} startId - 起始 ID
   * @returns {Array}
   */
  const transform = (sourceData, startId = 123) => {
    // 1. 语言基础配置 (用于填充 lang 对象中的静态字段)
    const langConfig = {
      zh_HK: { id: 1, label: '繁體中文' },
      en_US: { id: 2, label: '美式英文' },
      zh_CN: { id: 3, label: '简体中文' }
      // 可以根据需要补充更多
    }

    let currentId = startId
    const result = []

    // 2. 遍历语言 (zh_HK, en_US...)
    if (sourceData && sourceData.i18n) {
      Object.entries(sourceData.i18n).forEach(([langCode, translations]) => {
        // 获取语言元数据，如果没有配置则给默认值
        const langMeta = langConfig[langCode] || { id: 99, label: langCode }

        // 生成语言对象的通用时间戳 (假设同一种语言创建时间一致，也可以移到下方循环内随机)
        const langTimestamp = getRandomDate()

        // 3. 遍历该语言下的所有 Key (lowcode.xxx)
        Object.entries(translations).forEach(([key, content]) => {
          const record = {
            id: currentId++,
            key: key,
            content: content,
            host: 1, // 固定值
            host_type: 'app', // 固定值
            lang: {
              id: langMeta.id,
              lang: langCode,
              label: langMeta.label,
              created_by: null,
              updated_by: null,
              created_at: langTimestamp,
              updated_at: langTimestamp
            },
            created_by: null,
            updated_by: null,
            created_at: getRandomDate(),
            updated_at: getRandomDate()
          }

          result.push(record)
        })
      })
    }

    return result
  }

  return transform(sourceData, startId)
}
