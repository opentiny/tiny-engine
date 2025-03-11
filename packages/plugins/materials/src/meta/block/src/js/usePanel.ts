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

import { reactive } from 'vue'

const generateInitPanelState = () => ({
  created: false,
  show: false
})

const panelState = reactive({
  groupPanel: generateInitPanelState(),
  versionSelectPanel: generateInitPanelState()
})

const openPanel = (panel) => {
  panel.created = true
  panel.show = true
}

const closePanel = (panel) => {
  panel.show = false
}

const closeAllPanel = () => {
  Object.values(panelState).forEach(closePanel)
}

const generateUsePanelMethod = (panel) => {
  return () => ({
    panel,
    openPanel: () => openPanel(panel),
    closePanel: () => closePanel(panel)
  })
}

export const useGroupPanel = generateUsePanelMethod(panelState.groupPanel)

export const useVersionSelectPanel = generateUsePanelMethod(panelState.versionSelectPanel)

const generateSetVisibleMethod = (usePanel) => {
  return (visible) => {
    const { openPanel } = usePanel()

    closeAllPanel()
    if (visible) {
      openPanel()
    }
  }
}

export const setBlockPanelVisible = generateSetVisibleMethod(useGroupPanel)

export const setBlockVersionPanelVisible = generateSetVisibleMethod(useVersionSelectPanel)
