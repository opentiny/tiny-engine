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

export * from './hooks/'
import useMessage from './useMessage'
import useData from './useData'
export { default as metaData } from '../meta'
import example from './example'

export const getExample = example

export {
  useLayout,
  useCanvas,
  useApp,
  useResource,
  useHistory,
  useProperties,
  useSaveLocal,
  useEditorInfo,
  useBlock,
  useTranslate,
  usePage,
  useDataSource,
  useBreadcrumb,
  useProperty,
  useHelp,
  useModal,
  useNotify,
  useCustom
} from '@opentiny/tiny-engine-entry'

export { useData, useMessage }
