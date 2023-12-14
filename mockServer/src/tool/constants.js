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

export const E_TASK_STATUS = {
  INIT: 0,
  RUNNING: 1,
  STOPPED: 2,
  FINISHED: 3
}

export const E_TASK_TYPE = {
  ASSETS_BUILD: 1,
  APP_BUILD: 2,
  PLATFORM_BUILD: 3,
  VSCODE_PLUGIN_BUILD: 4,
  BLOCK_BUILD: 5
}
