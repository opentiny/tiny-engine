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

import { getResponseData } from '../tool/Common'
import groupList from '../assets/json/template/group'
import templateList from '../assets/json/template/template'

export default class TemplateService {
  constructor() {
    this.groupList = groupList
    this.templateList = templateList
  }

  async list() {
    return getResponseData(this.templateList)
  }

  async searchGroup(groupName) {
    const group = this.groupList.data.filter((item) => item.businessGroup === groupName)

    return getResponseData(group)
  }
}
