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

import {
  ButtonGroupConfigurator,
  CascaderConfigurator,
  CheckBoxConfigurator,
  CheckboxGroupConfigurator,
  CodeConfigurator,
  CodeListConfigurator,
  CollectionConfigurator,
  ColorConfigurator,
  DatePickerConfigurator,
  FormConfigurator,
  HtmlAttributesConfigurator,
  HtmlTextConfigurator,
  I18nConfigurator,
  InputConfigurator,
  IpSectionConfigurator,
  JsSlotConfigurator,
  NumberConfigurator,
  RadioConfigurator,
  RadioGroupConfigurator,
  SelectConfigurator,
  SelectIconConfigurator,
  SliderConfigurator,
  SlotConfigurator,
  SwitchConfigurator,
  VariableConfigurator
} from '@opentiny/tiny-engine-configurator'

import PluginSetting from './component/PluginSetting.vue'
import PluginPanel from './component/PluginPanel.vue'
import SvgButton from './component/SvgButton.vue'
import LinkButton from './component/LinkButton.vue'

import ConfigCollapse from './component/ConfigCollapse.vue'
import ConfigGroup from './component/ConfigGroup.vue'
import ConfigItem from './component/ConfigItem.vue'
import ConfigRender from './component/ConfigRender.vue'

import MetaArrayItem from './component/MetaArrayItem.vue'
import MetaListActions from './component/MetaListActions.vue'
import MetaGroupItem from './component/MetaGroupItem.vue'
import MetaLayoutGrid from './component/MetaLayoutGrid.vue'
import MetaListTitle from './component/MetaListTitle.vue'
import MetaListItems from './component/MetaListItems.vue'
import MetaListItem from './component/MetaListItem.vue'
import MetaModal, { useModal } from './component/MetaModal.vue'
import MetaPopover from './component/MetaPopover.vue'
import VideoGuide from './component/VideoGuide.vue'
import MetaContainer from './component/MetaContainer.vue'
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
import VueMonaco, { setGlobalEditorTheme } from './component/VueMonaco.vue'
import PublicIcon from './component/PublicIcon.vue'
import SaveNewBlock from './component/SaveNewBlock.vue'
import BindI18n from './component/BindI18n.vue'
import MetaRelatedEditor from './component/MetaRelatedEditor.vue'
import MetaRelatedColumns from './component/MetaRelatedColumns.vue'
import BlockDeployDialog from './component/BlockDeployDialog.vue'
import ProgressBar from './component/ProgressBar.vue'
import MetaTableColumns from './component/MetaTableColumns.vue'
import SearchEmpty from './component/SearchEmpty.vue'
import MetaDescription from './component/MetaDescription.vue'
import MetaList from './component/MetaList.vue'

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

// TODO: 后面由各自所需代码各自引入，然后删除
export const MetaComponents = {
  MetaArrayItem,
  MetaBindI18n: I18nConfigurator,
  MetaBindVariable: VariableConfigurator,
  MetaButtonGroup: ButtonGroupConfigurator,
  MetaCheckBox: CheckBoxConfigurator,
  MetaCascader: CascaderConfigurator,
  MetaCodeEditor: CodeConfigurator,
  MetaCodeEditorList: CodeListConfigurator,
  MetaColor: ColorConfigurator,
  MetaDatePicker: DatePickerConfigurator,
  MetaGroupItem,
  MetaInput: InputConfigurator,
  MetaLayoutGrid,
  MetaList,
  MetaModal,
  MetaNumber: NumberConfigurator,
  MetaNumeric: NumberConfigurator,
  MetaPopover,
  MetaRadio: RadioConfigurator,
  MetaSelect: SelectConfigurator,
  MetaSelectIcon: SelectIconConfigurator,
  MetaSlider: SliderConfigurator,
  MetaSwitch: SwitchConfigurator,
  MetaListTitle,
  MetaListActions,
  MetaListItems,
  MetaListItem,
  MetaForm: FormConfigurator,
  MetaCollection: CollectionConfigurator,
  MetaContainer,
  MetaJsSlot: JsSlotConfigurator,
  MetaSlot: SlotConfigurator,
  MetaHtmlText: HtmlTextConfigurator,
  MetaHtmlAttributes: HtmlAttributesConfigurator,
  MetaRadioGroup: RadioGroupConfigurator,
  MetaCheckboxGroup: CheckboxGroupConfigurator,
  MetaIpSection: IpSectionConfigurator,
  MetaRelatedEditor,
  MetaRelatedColumns,
  MetaTableColumns
}

export {
  I18nConfigurator as MetaBindI18n,
  VariableConfigurator as MetaBindVariable,
  CheckBoxConfigurator as MetaCheckBox,
  CodeConfigurator as MetaCodeEditor,
  CodeListConfigurator as MetaCodeEditorList,
  ColorConfigurator as MetaColor,
  DatePickerConfigurator as MetaDatePicker,
  MetaDescription,
  InputConfigurator as MetaInput,
  MetaList,
  MetaModal,
  NumberConfigurator as MetaNumber,
  MetaPopover,
  RadioConfigurator as MetaRadio,
  SelectConfigurator as MetaSelect,
  SelectIconConfigurator as MetaSelectIcon,
  SliderConfigurator as MetaSlider,
  SwitchConfigurator as MetaSwitch,
  MetaListTitle,
  MetaListActions,
  MetaListItems,
  MetaListItem,
  JsSlotConfigurator as MetaJsSlot,
  SlotConfigurator as MetaSlot,
  HtmlTextConfigurator as MetaHtmlText,
  FormConfigurator as MetaForm,
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
  CollectionConfigurator as MetaCollection,
  ButtonGroup,
  CloseIcon,
  LifeCycles,
  EmptyTip,
  MetaContainer,
  MonacoEditor,
  MaskModal,
  HtmlAttributesConfigurator as MetaHtmlAttributes,
  VueMonaco,
  setGlobalEditorTheme,
  PublicIcon,
  SaveNewBlock,
  BindI18n,
  BlockDeployDialog,
  ProgressBar,
  MetaTableColumns,
  SearchEmpty
}

export { default as Modal } from './component/Modal'
export { default as Notify } from './component/Notify'
