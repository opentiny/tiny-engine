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

import ConfigGroup from './ConfigGroup.vue'
import ConfigItem from './ConfigItem.vue'
import SaveNewBlock from './SaveNewBlock.vue'
export { default as PluginSetting } from './PluginSetting.vue'
export { default as PluginPanel } from './PluginPanel.vue'
export { default as SvgButton } from './SvgButton.vue'
export { default as LinkButton } from './LinkButton.vue'
export { default as ConfigCollapse } from './ConfigCollapse.vue'
export { default as ConfigRender } from './ConfigRender.vue'
export { default as MetaForm } from './MetaForm.vue'
export { default as ModalMask, useModalMask } from './ModalMask.vue'
export { default as ResetButton } from './ResetButton.vue'
export { default as MetaListActions } from './MetaListActions.vue'
export { default as MetaListTitle } from './MetaListTitle.vue'
export { default as MetaListItems } from './MetaListItems.vue'
export { default as MetaListItem } from './MetaListItem.vue'
export { default as MetaModal, useModal } from './MetaModal.vue'
export { default as MetaModalItem } from './MetaModalItem.vue'
export { default as MetaPopover } from './MetaPopover.vue'
export { default as MetaCodeEditor } from './MetaCodeEditor.vue'
export { default as VideoGuide } from './VideoGuide.vue'
export { default as MonacoEditor } from './MonacoEditor.vue'
export { default as BlockHistoryList } from './BlockHistoryList.vue'
export { default as BlockHistoryTemplate } from './BlockHistoryTemplate.vue'
export { default as BlockLinkField } from './BlockLinkField.vue'
export { default as BlockLinkEvent } from './BlockLinkEvent.vue'
export { default as BlockDescription } from './BlockDescription.vue'
export { default as PluginBlockList } from './PluginBlockList.vue'
export { default as ButtonGroup } from './ButtonGroup.vue'
export { default as CloseIcon } from './CloseIcon.vue'
export { default as LifeCycles } from './LifeCycles.vue'
export { default as EmptyTip } from './EmptyTip.vue'
export { default as MaskModal } from './MaskModal.vue'
export { default as VueMonaco, setGlobalMonacoEditorTheme } from './VueMonaco.vue'
export { default as PublicIcon } from './PublicIcon.vue'
export { default as BindI18n } from './BindI18n.vue'
export { default as BlockDeployDialog } from './BlockDeployDialog.vue'
export { default as ProgressBar } from './ProgressBar.vue'
export { default as SearchEmpty } from './SearchEmpty.vue'
export { default as MetaDescription } from './MetaDescription.vue'
export { default as MetaList } from './MetaList.vue'
export { default as MetaChildItem } from './MetaChildItem.vue'
export { default as SplitPanes } from './SplitPanes.vue'
export { default as Pane } from './Pane.vue'
export { default as I18nInput } from './I18nInput.vue'
export { default as CanvasDragItem } from './CanvasDragItem.vue'
export { default as Modal } from './Modal.jsx'
export { default as Notify } from './Notify.jsx'
export { ConfigGroup, ConfigItem, SaveNewBlock }

export const injectGlobalComponents = {
  install: (app) => {
    const globalComponents = {
      SaveNewBlock,
      ConfigGroup,
      ConfigItem
    }
    Object.entries(globalComponents).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
