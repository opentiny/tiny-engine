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

/**
 * 组件映射关系，默认使用 Tiny React 组件，支持传入其它组件库的映射关系(tiny react如今只有两个组件)
 * @summary 建议：添加时，按照组件名称的字母序排列
 */
const DEFAULT_COMPONENTS_MAP = [
  {
    componentName: 'TinyAlert',
    exportName: 'Alert',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyBreadcrumb',
    exportName: 'Breadcrumb',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyBreadcrumbItem',
    exportName: 'Breadcrumb.Item',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyButton',
    exportName: 'Button',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyButtonGroup',
    exportName: 'Button.Group',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCheckbox',
    exportName: 'Checkbox',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCheckboxButton',
    exportName: 'Checkbox.Button',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCheckboxGroup',
    exportName: 'Checkbox.Group',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCol',
    exportName: 'Col',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCollapse',
    exportName: 'Collapse',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyCollapseItem',
    exportName: 'Collapse.Panel',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyDatePicker',
    exportName: 'DatePicker',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyDialogBox',
    exportName: 'Modal',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyFloatbar',
    exportName: 'FloatButton',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyForm',
    exportName: 'Form',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyFormItem',
    exportName: 'Form.Item',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyGrid',
    exportName: 'Row',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAdd',
    exportName: 'iconAdd',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAdministrator',
    exportName: 'iconAdministrator',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignBaseline',
    exportName: 'iconAlignBaseline',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignCenter',
    exportName: 'iconAlignCenter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignFlexCenter',
    exportName: 'iconAlignFlexCenter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignFlexEnd',
    exportName: 'iconAlignFlexEnd',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignFlexStart',
    exportName: 'iconAlignFlexStart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignJustify',
    exportName: 'iconAlignJustify',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignLeft',
    exportName: 'iconAlignLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignRight',
    exportName: 'iconAlignRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAlignStretch',
    exportName: 'iconAlignStretch',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAngularjs',
    exportName: 'iconAngularjs',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconApp',
    exportName: 'iconApp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconApplication',
    exportName: 'iconApplication',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAreaChart',
    exportName: 'iconAreaChart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconArrowDown',
    exportName: 'iconArrowDown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconArrowLeft',
    exportName: 'iconArrowLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconArrowRight',
    exportName: 'iconArrowRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconArrowUp',
    exportName: 'iconArrowUp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAscending',
    exportName: 'iconAscending',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAssociation',
    exportName: 'iconAssociation',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconAttachment',
    exportName: 'iconAttachment',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconBarChart',
    exportName: 'iconBarChart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconBefilter',
    exportName: 'iconBefilter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconBoat',
    exportName: 'iconBoat',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconBoxSolid',
    exportName: 'iconBoxSolid',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconBusy',
    exportName: 'iconBusy',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCalculator',
    exportName: 'iconCalculator',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCalendar',
    exportName: 'iconCalendar',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCheck',
    exportName: 'iconCheck',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCheckOut',
    exportName: 'iconCheckOut',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCheckedLinear',
    exportName: 'iconCheckedLinear',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCheckedSur',
    exportName: 'iconCheckedSur',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCheckedTrue',
    exportName: 'iconCheckedTrue',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconChevronDown',
    exportName: 'iconChevronDown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconChevronLeft',
    exportName: 'iconChevronLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconChevronRight',
    exportName: 'iconChevronRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconChevronUp',
    exportName: 'iconChevronUp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconClearFilter',
    exportName: 'iconClearFilter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconClockWork',
    exportName: 'iconClockWork',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconClose',
    exportName: 'iconClose',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCloseCircle',
    exportName: 'iconCloseCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCloseSquare',
    exportName: 'iconCloseSquare',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCloudDownload',
    exportName: 'iconCloudDownload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCloudUpload',
    exportName: 'iconCloudUpload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCode',
    exportName: 'iconCode',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCoin',
    exportName: 'iconCoin',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconColReverse',
    exportName: 'iconColReverse',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCommission',
    exportName: 'iconCommission',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconConmentRefresh',
    exportName: 'iconConmentRefresh',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCopy',
    exportName: 'iconCopy',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCopySolid',
    exportName: 'iconCopySolid',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCourse',
    exportName: 'iconCourse',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCueL',
    exportName: 'iconCueL',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCustom',
    exportName: 'iconCustom',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconCustomerService',
    exportName: 'iconCustomerService',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDataSource',
    exportName: 'iconDataSource',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDefault',
    exportName: 'iconDefault',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDefinedFiltration',
    exportName: 'iconDefinedFiltration',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDel',
    exportName: 'iconDel',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeletePage',
    exportName: 'iconDeletePage',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeleted',
    exportName: 'iconDeleted',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaDown',
    exportName: 'iconDeltaDown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaDownO',
    exportName: 'iconDeltaDownO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaLeft',
    exportName: 'iconDeltaLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaLeftO',
    exportName: 'iconDeltaLeftO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaRight',
    exportName: 'iconDeltaRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaRightO',
    exportName: 'iconDeltaRightO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaUp',
    exportName: 'iconDeltaUp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDeltaUpO',
    exportName: 'iconDeltaUpO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDerive',
    exportName: 'iconDerive',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDescending',
    exportName: 'iconDescending',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDesktopView',
    exportName: 'iconDesktopView',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDialog',
    exportName: 'iconDialog',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDialog2',
    exportName: 'iconDialog2',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDirectionCol',
    exportName: 'iconDirectionCol',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDirectionRow',
    exportName: 'iconDirectionRow',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDotChart',
    exportName: 'iconDotChart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDotIpv4',
    exportName: 'iconDotIpv4',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDoubleLeft',
    exportName: 'iconDoubleLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDoubleRight',
    exportName: 'iconDoubleRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDown',
    exportName: 'iconDown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDownO',
    exportName: 'iconDownO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDownload',
    exportName: 'iconDownload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDownloadCloud',
    exportName: 'iconDownloadCloud',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDownloadLink',
    exportName: 'iconDownloadLink',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconDraft',
    exportName: 'iconDraft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEdit',
    exportName: 'iconEdit',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEditorTab',
    exportName: 'iconEditorTab',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEllipsis',
    exportName: 'iconEllipsis',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEmailAdd',
    exportName: 'iconEmailAdd',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEmailCircle',
    exportName: 'iconEmailCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEnd',
    exportName: 'iconEnd',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconError',
    exportName: 'iconError',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEspace',
    exportName: 'iconEspace',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEspaceAuto',
    exportName: 'iconEspaceAuto',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconExcel',
    exportName: 'iconExcel',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconException',
    exportName: 'iconException',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconExclamation',
    exportName: 'iconExclamation',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconExport',
    exportName: 'iconExport',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconExpressSearch',
    exportName: 'iconExpressSearch',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEyeclose',
    exportName: 'iconEyeclose',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconEyeopen',
    exportName: 'iconEyeopen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFile',
    exportName: 'iconFile',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFileCloudupload',
    exportName: 'iconFileCloudupload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFileExcel',
    exportName: 'iconFileExcel',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFiles',
    exportName: 'iconFiles',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFilesCircle',
    exportName: 'iconFilesCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFiletext',
    exportName: 'iconFiletext',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFileupload',
    exportName: 'iconFileupload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFiltered',
    exportName: 'iconFiltered',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFlag',
    exportName: 'iconFlag',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFolderClosed',
    exportName: 'iconFolderClosed',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFolderOpened',
    exportName: 'iconFolderOpened',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFontColor',
    exportName: 'iconFontColor',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFontFamily',
    exportName: 'iconFontFamily',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFontSize',
    exportName: 'iconFontSize',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFontStyle',
    exportName: 'iconFontStyle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFontWeight',
    exportName: 'iconFontWeight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFreezeLeft',
    exportName: 'iconFreezeLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFreezeRight',
    exportName: 'iconFreezeRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFrown',
    exportName: 'iconFrown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFrownO',
    exportName: 'iconFrownO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconFullscreen',
    exportName: 'iconFullscreen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconGrade',
    exportName: 'iconGrade',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconGroup',
    exportName: 'iconGroup',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconGroupTransfer',
    exportName: 'iconGroupTransfer',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHalfchecked',
    exportName: 'iconHalfchecked',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHalfselect',
    exportName: 'iconHalfselect',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHeartempty',
    exportName: 'iconHeartempty',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHelp',
    exportName: 'iconHelp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHelpCircle',
    exportName: 'iconHelpCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHelpQuery',
    exportName: 'iconHelpQuery',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHelpSolid',
    exportName: 'iconHelpSolid',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHelpful',
    exportName: 'iconHelpful',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHideLeft',
    exportName: 'iconHideLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHideRight',
    exportName: 'iconHideRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconHideTopleft',
    exportName: 'iconHideTopleft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconImport',
    exportName: 'iconImport',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconInfo',
    exportName: 'iconInfo',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconInfoCircle',
    exportName: 'iconInfoCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconInfoSolid',
    exportName: 'iconInfoSolid',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconInformation',
    exportName: 'iconInformation',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJs',
    exportName: 'iconJs',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJusitfyCenter',
    exportName: 'iconJusitfyCenter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJusitfyFlexEnd',
    exportName: 'iconJusitfyFlexEnd',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJusitfySpaceAround',
    exportName: 'iconJusitfySpaceAround',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJusitfySpaceBetween',
    exportName: 'iconJusitfySpaceBetween',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconJustitfyFlexStart',
    exportName: 'iconJustitfyFlexStart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLanguage',
    exportName: 'iconLanguage',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLeave',
    exportName: 'iconLeave',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLeft',
    exportName: 'iconLeft',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLeftFrozen',
    exportName: 'iconLeftFrozen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLeftO',
    exportName: 'iconLeftO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLeftWard',
    exportName: 'iconLeftWard',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLineChart',
    exportName: 'iconLineChart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLineHeight',
    exportName: 'iconLineHeight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLineThrought',
    exportName: 'iconLineThrought',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLink',
    exportName: 'iconLink',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLoading',
    exportName: 'iconLoading',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconLock',
    exportName: 'iconLock',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMail',
    exportName: 'iconMail',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMailContent',
    exportName: 'iconMailContent',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMale',
    exportName: 'iconMale',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMarkOn',
    exportName: 'iconMarkOn',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMeh',
    exportName: 'iconMeh',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMessageCircle',
    exportName: 'iconMessageCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMinscreen',
    exportName: 'iconMinscreen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMinus',
    exportName: 'iconMinus',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMinusCircle',
    exportName: 'iconMinusCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMinusSquare',
    exportName: 'iconMinusSquare',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMobile',
    exportName: 'iconMobile',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMobileView',
    exportName: 'iconMobileView',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconMore',
    exportName: 'iconMore',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNew',
    exportName: 'iconNew',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNoPremission',
    exportName: 'iconNoPremission',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNode',
    exportName: 'iconNode',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNodeOpen',
    exportName: 'iconNodeOpen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNodejs',
    exportName: 'iconNodejs',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconNone',
    exportName: 'iconNone',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconOffLine',
    exportName: 'iconOffLine',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconOnLine',
    exportName: 'iconOnLine',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconOperationfaild',
    exportName: 'iconOperationfaild',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconOperationfaildL',
    exportName: 'iconOperationfaildL',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconOuterLink',
    exportName: 'iconOuterLink',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPagelink',
    exportName: 'iconPagelink',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPagerFirst',
    exportName: 'iconPagerFirst',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPagerLast',
    exportName: 'iconPagerLast',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPagerNext',
    exportName: 'iconPagerNext',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPagerPrev',
    exportName: 'iconPagerPrev',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPanelMax',
    exportName: 'iconPanelMax',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPanelMini',
    exportName: 'iconPanelMini',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPanelNormal',
    exportName: 'iconPanelNormal',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPause',
    exportName: 'iconPause',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPauseCircle',
    exportName: 'iconPauseCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPicture',
    exportName: 'iconPicture',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPieChart',
    exportName: 'iconPieChart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPlus',
    exportName: 'iconPlus',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPlusCircle',
    exportName: 'iconPlusCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPlusSquare',
    exportName: 'iconPlusSquare',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPopup',
    exportName: 'iconPopup',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPreChecked',
    exportName: 'iconPreChecked',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPrintPreview',
    exportName: 'iconPrintPreview',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconPushpin',
    exportName: 'iconPushpin',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRadio',
    exportName: 'iconRadio',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRadioselected',
    exportName: 'iconRadioselected',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconReactjs',
    exportName: 'iconReactjs',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRedo',
    exportName: 'iconRedo',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRefres',
    exportName: 'iconRefres',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRenew',
    exportName: 'iconRenew',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRepeat',
    exportName: 'iconRepeat',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconReplace',
    exportName: 'iconReplace',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconReplies',
    exportName: 'iconReplies',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRight',
    exportName: 'iconRight',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRightFrozen',
    exportName: 'iconRightFrozen',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRightO',
    exportName: 'iconRightO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRightward',
    exportName: 'iconRightward',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconRowReverse',
    exportName: 'iconRowReverse',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSandwichCollapse',
    exportName: 'iconSandwichCollapse',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSandwichExpand',
    exportName: 'iconSandwichExpand',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSave',
    exportName: 'iconSave',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconScissor',
    exportName: 'iconScissor',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSearch',
    exportName: 'iconSearch',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSelect',
    exportName: 'iconSelect',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSent',
    exportName: 'iconSent',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSeparate',
    exportName: 'iconSeparate',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSetting',
    exportName: 'iconSetting',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconShare',
    exportName: 'iconShare',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconShoppingCard',
    exportName: 'iconShoppingCard',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSmile',
    exportName: 'iconSmile',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSmileO',
    exportName: 'iconSmileO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSort',
    exportName: 'iconSort',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSortDefault',
    exportName: 'iconSortDefault',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStarActive',
    exportName: 'iconStarActive',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStarDisable',
    exportName: 'iconStarDisable',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStarO',
    exportName: 'iconStarO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStart',
    exportName: 'iconStart',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStartCircle',
    exportName: 'iconStartCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStatistics',
    exportName: 'iconStatistics',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStop',
    exportName: 'iconStop',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconStreamSolid',
    exportName: 'iconStreamSolid',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSuccess',
    exportName: 'iconSuccess',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconSuccessful',
    exportName: 'iconSuccessful',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTabletView',
    exportName: 'iconTabletView',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTaskCooperation',
    exportName: 'iconTaskCooperation',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTelephone',
    exportName: 'iconTelephone',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTelephoneCircle',
    exportName: 'iconTelephoneCircle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconText',
    exportName: 'iconText',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTextAlign',
    exportName: 'iconTextAlign',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTextDecoration',
    exportName: 'iconTextDecoration',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTextTab',
    exportName: 'iconTextTab',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTime',
    exportName: 'iconTime',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTotal',
    exportName: 'iconTotal',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconTriangleDown',
    exportName: 'iconTriangleDown',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUndelete',
    exportName: 'iconUndelete',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnderline',
    exportName: 'iconUnderline',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUndo',
    exportName: 'iconUndo',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnfilter',
    exportName: 'iconUnfilter',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnfreeze',
    exportName: 'iconUnfreeze',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnknow',
    exportName: 'iconUnknow',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnlock',
    exportName: 'iconUnlock',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUnsent',
    exportName: 'iconUnsent',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUp',
    exportName: 'iconUp',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUpO',
    exportName: 'iconUpO',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUpload',
    exportName: 'iconUpload',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconUser',
    exportName: 'iconUser',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconVersiontree',
    exportName: 'iconVersiontree',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconView',
    exportName: 'iconView',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconVuejs',
    exportName: 'iconVuejs',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconWarning',
    exportName: 'iconWarning',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconWarningTriangle',
    exportName: 'iconWarningTriangle',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconWebPlus',
    exportName: 'iconWebPlus',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconWriting',
    exportName: 'iconWriting',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconYes',
    exportName: 'iconYes',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconZoomIn',
    exportName: 'iconZoomIn',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyIconZoomOut',
    exportName: 'iconZoomOut',
    package: '@opentiny/react-icon',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyInput',
    exportName: 'Input',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyModal',
    exportName: 'Modal',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyNumeric',
    exportName: 'Numeric',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyPager',
    exportName: 'Pager',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyPopeditor',
    exportName: 'Popeditor',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyPopover',
    exportName: 'Popover',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyRadio',
    exportName: 'Radio',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyRow',
    exportName: 'Row',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinySearch',
    exportName: 'Search',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinySelect',
    exportName: 'Select',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinySwitch',
    exportName: 'Switch',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyTabs',
    exportName: 'Tabs',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyTabItem',
    exportName: 'TabItem',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyTimeLine',
    exportName: 'TimeLine',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyTooltip',
    exportName: 'Tooltip',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  },
  {
    componentName: 'TinyTree',
    exportName: 'Tree',
    package: 'antd',
    version: '^3.10.0',
    destructuring: true
  }
]

// 内置组件映射关系
const BUILTIN_COMPONENTS_MAP = [
  {
    componentName: 'CanvasRow',
    exportName: 'CanvasRow',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  },
  {
    componentName: 'CanvasCol',
    exportName: 'CanvasCol',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  },
  {
    componentName: 'CanvasRowColContainer',
    exportName: 'CanvasRowColContainer',
    package: '@opentiny/tiny-engine-builtin-component',
    version: '^0.1.0',
    destructuring: true
  }
]

const AntdComponents = [
  {
    componentName: 'AntdButton',
    destructuring: true,
    exportName: 'Button',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdCheckbox',
    destructuring: true,
    exportName: 'Checkbox',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdCheckboxGroup',
    destructuring: true,
    exportName: 'Checkbox',
    subName: 'Group',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdInput',
    destructuring: true,
    exportName: 'Input',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadio',
    destructuring: true,
    exportName: 'Radio',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadioButton',
    destructuring: true,
    exportName: 'Radio',
    subName: 'Button',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdRadioGroup',
    destructuring: true,
    exportName: 'Radio',
    subName: 'Group',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdSelect',
    destructuring: true,
    exportName: 'Select',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdTable',
    destructuring: true,
    exportName: 'Table',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdForm',
    destructuring: true,
    exportName: 'Form',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdFormItem',
    destructuring: true,
    exportName: 'Form',
    subName: 'Item',
    package: 'antd',
    version: '^5.16.0'
  },
  {
    componentName: 'AntdSwitch',
    destructuring: true,
    exportName: 'Switch',
    package: 'antd',
    version: '^5.16.0'
  }
]

/**
 * 内部保留组件名称，出码时可能需要特殊处理
 */
const BUILTIN_COMPONENT_NAME = {
  PAGE: 'Page',
  BLOCK: 'Block',
  TEMPLATE: 'Template',
  SLOT: 'Slot',
  COLLECTION: 'Collection',
  TEXT: 'Text',
  ICON: 'Icon'
}

/**
 * 图标组件名，统一前缀为 TinyIcon，与从组件库引入的方法名 iconXxx 区分开
 */
const TINY_ICON = 'TinyIcon'

/**
 * 占位标识，用于解开字符串的双引号，输出原始表达式
 */
const UNWRAP_QUOTES = {
  start: '#QUOTES_START#',
  end: '#QUOTES_END#'
}

const IntrinsicElements = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noindex',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'search',
  'slot',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'template',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'webview',
  'svg',
  'animate',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'foreignObject',
  'g',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'set',
  'stop',
  'switch',
  'symbol',
  'text',
  'textPath',
  'tspan',
  'use',
  'view'
]

/**
 * 协议中的类型
 */
export const [JS_EXPRESSION, JS_FUNCTION, JS_I18N, JS_RESOURCE, JS_SLOT] = [
  'JSExpression',
  'JSFunction',
  'i18n',
  'JSResource',
  'JSSlot'
]

export {
  DEFAULT_COMPONENTS_MAP,
  BUILTIN_COMPONENT_NAME,
  TINY_ICON,
  UNWRAP_QUOTES,
  BUILTIN_COMPONENTS_MAP,
  IntrinsicElements,
  AntdComponents
}
