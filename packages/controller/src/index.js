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

import './hooks/mountHooks'
import useMessage from './useMessage'
import { getGlobalConfig, setGlobalConfig } from './globalConfig'
import useData from './useData'
export { default as metaData } from '../meta'
import example from './example'

// 后续移入common包components
import useNotify from './components/useNotify'
import useModal from './components/useModal'

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
  useCustom
} from '@opentiny/tiny-engine-entry'

export { getGlobalConfig, setGlobalConfig, useNotify, useData, useMessage, useModal }
