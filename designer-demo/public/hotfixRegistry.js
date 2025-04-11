/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

export default {
  'engine.plugins.i18n': {
    overwrite: {
      methods: {
        '': {
          openEditor: (ctx) => (_event, row) => {
            const { isEditMode, editingRow, i18nTable, langList, getActiveRow, utils } = ctx()
            isEditMode.value = Boolean(row.key)
            editingRow.value = row
            if (!isEditMode.value) {
              row.key = `custom.${utils.guid()}`
              langList.value.unshift(row)
            }
            i18nTable.value.setActiveRow(row).then(() => {
              getActiveRow()
            })
          }
        }
      },
      lifeCycles: {
        '': {
          onMounted: [
            (ctx) => () => {
              const { i18nSearchTypes, currentSearchType } = ctx()
              console.log('overWrite i18n onMounted', i18nSearchTypes, currentSearchType.value)
              currentSearchType.value = i18nSearchTypes[0].value
            }
          ]
        }
      }
    }
  }
}
