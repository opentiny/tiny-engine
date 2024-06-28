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

import PluginSetting from './component/PluginSetting.vue'
import PluginPanel from './component/PluginPanel.vue'
import SvgButton from './component/SvgButton.vue'
import LinkButton from './component/LinkButton.vue'

import ConfigCollapse from './component/ConfigCollapse.vue'
import ConfigGroup from './component/ConfigGroup.vue'
import ConfigItem from './component/ConfigItem.vue'
import ConfigRender from './component/ConfigRender.vue'

import MetaForm from './component/MetaForm.vue'
import MetaListActions from './component/MetaListActions.vue'
import MetaListTitle from './component/MetaListTitle.vue'
import MetaListItems from './component/MetaListItems.vue'
import MetaListItem from './component/MetaListItem.vue'
import MetaModal, { useModal } from './component/MetaModal.vue'
import MetaModalItem from './component/MetaModalItem.vue'
import MetaPopover from './component/MetaPopover.vue'
import VideoGuide from './component/VideoGuide.vue'
import MonacoEditor from './component/MonacoEditor.vue'
import BlockHistoryList from './component/BlockHistoryList.vue'
import BlockHistoryTemplate from './component/BlockHistoryTemplate.vue'
import BlockLinkField from './component/BlockLinkField.vue'
import BlockLinkEvent from './component/BlockLinkEvent.vue'
import BlockDescription from './component/BlockDescription.vue'
import PluginBlockList from './component/PluginBlockList.vue'
import ButtonGroup from './component/ButtonGroup.vue'
import CloseIcon from './component/CloseIcon.vue'
import LifeCycles from './component/LifeCycles.vue'
import EmptyTip from './component/EmptyTip.vue'
import MaskModal from './component/MaskModal.vue'
import VueMonaco, { setGlobalMonacoEditorTheme } from './component/VueMonaco.vue'
import PublicIcon from './component/PublicIcon.vue'
import SaveNewBlock from './component/SaveNewBlock.vue'
import BindI18n from './component/BindI18n.vue'
import BlockDeployDialog from './component/BlockDeployDialog.vue'
import ProgressBar from './component/ProgressBar.vue'
import SearchEmpty from './component/SearchEmpty.vue'
import MetaDescription from './component/MetaDescription.vue'
import MetaList from './component/MetaList.vue'
import MetaChildItem from './component/MetaChildItem.vue'
import SplitPanes from './component/SplitPanes.vue'
import Pane from './component/Pane.vue'

import i18n, { i18nKeyMaps } from '@opentiny/tiny-engine-controller/js/i18n'

import enUs from './i18n/en-us.json'
import zhCn from './i18n/zh-cn.json'

const { mergeLocaleMessage } = i18n.global

mergeLocaleMessage(i18nKeyMaps.enUS, enUs)
mergeLocaleMessage(i18nKeyMaps.zhCN, zhCn)

const globalComponents = {
  SaveNewBlock,
  ConfigGroup,
  ConfigItem
}

export const injectGlobalComponents = {
  install: (app) => {
    Object.entries(globalComponents).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}

export {
  MetaDescription,
  MetaList,
  MetaModal,
  MetaModalItem,
  MetaPopover,
  MetaListTitle,
  MetaListActions,
  MetaListItems,
  MetaListItem,
  MetaChildItem,
  MetaForm,
  ConfigCollapse,
  ConfigGroup,
  ConfigItem,
  ConfigRender,
  useModal,
  PluginSetting,
  PluginPanel,
  VideoGuide,
  SvgButton,
  LinkButton,
  BlockHistoryList,
  BlockHistoryTemplate,
  BlockLinkField,
  BlockLinkEvent,
  BlockDescription,
  PluginBlockList,
  ButtonGroup,
  CloseIcon,
  LifeCycles,
  EmptyTip,
  MonacoEditor,
  MaskModal,
  VueMonaco,
  setGlobalMonacoEditorTheme,
  PublicIcon,
  SaveNewBlock,
  BindI18n,
  BlockDeployDialog,
  ProgressBar,
  SearchEmpty,
  SplitPanes,
  Pane
}

export { default as Modal } from './component/Modal'
export { default as Notify } from './component/Notify'
