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

import { getMergeMeta } from '@opentiny/tiny-engine-entry'

/**
 * 判断 Monaco 编辑器背景色的主题
 * @returns
 */
// TODO: 后续放入Monaco组件中，由组件提供API设置主题
export const theme = () => {
  const theme = getMergeMeta('engine.config').theme?.includes('dark') ? 'vs-dark' : 'vs'

  return theme
}
