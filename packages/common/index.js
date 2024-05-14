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

import MetaArrayItem from './component/MetaArrayItem.vue'
import MetaBindI18n from './component/MetaBindI18n.vue'
import MetaBindVariable from './component/MetaBindVariable.vue'
import MetaCascader from './component/MetaCascader.vue'
import MetaCheckBox from './component/MetaCheckBox.vue'
import MetaCodeEditor from './component/MetaCodeEditor.vue'
import MetaCodeEditorList from './component/MetaCodeEditorList.vue'
import MetaCollection from './component/MetaCollection.vue'
import MetaColor from './component/MetaColor.vue'
import MetaDatePicker from './component/MetaDatePicker.vue'
import MetaDescription from './component/MetaDescription.vue'
import MetaForm from './component/MetaForm.vue'
import MetaGroupItem from './component/MetaGroupItem.vue'
import MetaInput from './component/MetaInput.vue'
import MetaLayoutGrid from './component/MetaLayoutGrid.vue'
import MetaList from './component/MetaList.vue'
import MetaListTitle from './component/MetaListTitle.vue'
import MetaListActions from './component/MetaListActions.vue'
import MetaListItems from './component/MetaListItems.vue'
import MetaListItem from './component/MetaListItem.vue'
import MetaModal, { useModal } from './component/MetaModal.vue'
import MetaNumber from './component/MetaNumber.vue'
import MetaPopover from './component/MetaPopover.vue'
import MetaRadio from './component/MetaRadio.vue'
import MetaSelect from './component/MetaSelect.vue'
import MetaSelectIcon from './component/MetaSelectIcon.vue'
import MetaSlider from './component/MetaSlider.vue'
import MetaSwitch from './component/MetaSwitch.vue'
import MetaContainer from './component/MetaContainer.vue'
import MetaJsSlot from './component/MetaJsSlot.vue'
import MetaSlot from './component/MetaSlot.vue'
import MetaHtmlText from './component/MetaHtmlText.vue'
import MetaHtmlAttributes from './component/MetaHtmlAttributes.vue'
import MetaRadioGroup from './component/MetaRadioGroup.vue'
import MetaCheckboxGroup from './component/MetaCheckboxGroup.vue'
import MetaIpSection from './component/MetaIpSection.vue'
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
import VueMonaco from './component/VueMonaco.vue'
import PublicIcon from './component/PublicIcon.vue'
import SaveNewBlock from './component/SaveNewBlock.vue'
import BindI18n from './component/BindI18n.vue'
import MetaRelatedEditor from './component/MetaRelatedEditor.vue'
import MetaRelatedColumns from './component/MetaRelatedColumns.vue'
import BlockDeployDialog from './component/BlockDeployDialog.vue'
import ProgressBar from './component/ProgressBar.vue'
import MetaButtonGroup from './component/MetaButtonGroup.vue'
import MetaTableColumns from './component/MetaTableColumns.vue'
import SearchEmpty from './component/SearchEmpty.vue'

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

export const MetaComponents = {
  MetaArrayItem,
  MetaBindI18n,
  MetaBindVariable,
  MetaButtonGroup,
  MetaCheckBox,
  MetaCascader,
  MetaCodeEditor,
  MetaCodeEditorList,
  MetaColor,
  MetaDatePicker,
  MetaDescription,
  MetaGroupItem,
  MetaInput,
  MetaLayoutGrid,
  MetaList,
  MetaModal,
  MetaNumber,
  MetaNumeric: MetaNumber,
  MetaPopover,
  MetaRadio,
  MetaSelect,
  MetaSelectIcon,
  MetaSlider,
  MetaSwitch,
  MetaListTitle,
  MetaListActions,
  MetaListItems,
  MetaListItem,
  MetaForm,
  MetaCollection,
  MetaContainer,
  MetaJsSlot,
  MetaSlot,
  MetaHtmlText,
  MetaHtmlAttributes,
  MetaRadioGroup,
  MetaCheckboxGroup,
  MetaIpSection,
  MetaRelatedEditor,
  MetaRelatedColumns,
  MetaTableColumns,
  SearchEmpty
}

export {
  MetaBindI18n,
  MetaBindVariable,
  MetaCheckBox,
  MetaCodeEditor,
  MetaCodeEditorList,
  MetaColor,
  MetaDatePicker,
  MetaDescription,
  MetaInput,
  MetaList,
  MetaModal,
  MetaNumber,
  MetaPopover,
  MetaRadio,
  MetaSelect,
  MetaSelectIcon,
  MetaSlider,
  MetaSwitch,
  MetaListTitle,
  MetaListActions,
  MetaListItems,
  MetaListItem,
  MetaJsSlot,
  MetaSlot,
  MetaHtmlText,
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
  MetaCollection,
  ButtonGroup,
  CloseIcon,
  LifeCycles,
  EmptyTip,
  MetaContainer,
  MonacoEditor,
  MaskModal,
  MetaHtmlAttributes,
  VueMonaco,
  PublicIcon,
  SaveNewBlock,
  BindI18n,
  BlockDeployDialog,
  ProgressBar,
  MetaTableColumns,
  SearchEmpty
}
