import path from 'path'
import fs from 'fs-extra'
import { getResponseData } from '../tool/Common'

const schemaFilePath = path.resolve(process.cwd(), './src/mock/get/app-center/v1/apps/schema/1.json')
export default class PageService {
  constructor() {

  }

  async create(params) {
    return this.update(params)
  }

  async update(params) {
    const schemaData = fs.readJSONSync(schemaFilePath)

    Object.entries(schemaData?.data?.i18n || {}).forEach(([lang, translations]) => {
      translations[params.key] = params.contents[lang] || ''
    })

    fs.writeJSONSync(schemaFilePath, schemaData, { spaces: 2 })
    return getResponseData({ "data": [], "locale": "zh-cn" ,"mock": true})
  }

  async delete(params) {
    //读取schema文件
    const schemaData = fs.readJSONSync(schemaFilePath)

    Object.entries(schemaData?.data?.i18n || {}).forEach(([lang, translations]) => {
      params.key_in.forEach((key) => {
        if (translations.hasOwnProperty(key)) {
          delete translations[key]
        }
      })
    })

    //写回schema文件
    fs.writeJSONSync(schemaFilePath, schemaData, { spaces: 2 })
    return getResponseData({ "data": [], "locale": "zh-cn" ,"mock": true})
  }
}
