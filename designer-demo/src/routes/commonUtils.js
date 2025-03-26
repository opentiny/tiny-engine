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
// 获取 yyyy-MM-dd HH:mm:ss 格式的时间
export function formatDateTime() {
  const date = new Date()
  
  // 获取各时间组件
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始要+1
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 组合成目标格式
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取返回数据结构
export const getResponseData = (data, error) => {
  const res = {
    code: 200,
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

// demo 应用只有唯一的一个用户
export const occupier = {
  "id": 1,
  "createdBy": 1,
  "lastUpdatedBy": 1,
  "tenantId": 1,
  "renterId": null,
  "siteId": 1,
  "username": "开发者",
  "email": "developer@lowcode.com",
  "isEnable": null,
  "isAdmin": true,
  "isPublic": null,
  "created_at": "2024-10-16 23:28:41",
  "updated_at": "2024-10-16 23:28:41"
}
