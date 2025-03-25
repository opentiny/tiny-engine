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

import CheckValue from './inputs/CheckValue.vue'
import SelectOption from './inputs/SelectOption.vue'
import CodeEditor from './inputs/CodeEditor.vue'
import LifeCycle from './groups/LifeCycle.vue'
import DraggableOptions from './inputs/DraggableOptions.vue'
import TableColumn from './groups/TableColumn.vue'
import TablePager from './groups/TablePager.vue'
import * as configurators from '@opentiny/tiny-engine-configurator'

export default {
  CheckValue,
  SelectOption,
  CodeEditor,
  TableColumn,
  TablePager,
  LifeCycle,
  DraggableOptions,
  ...configurators
}
