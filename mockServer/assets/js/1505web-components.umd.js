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

;(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('@opentiny/vue'))
  } else if (typeof define === 'function' && define.amd) {
    define(['@opentiny/vue'], factory)
  } else {
    ;(global = typeof globalThis !== 'undefined' ? globalThis : global || self),
      (global.TinyLowcodeComponent = factory(global.TinyVue))
  }
})(this, (tinyVue3) => {
  'use strict'
  const Mapper = {
    TinyCarouselItem: tinyVue3.CarouselItem,
    TinyCheckboxButton: tinyVue3.CheckboxButton,
    TinyTree: tinyVue3.Tree,
    TinyPopover: tinyVue3.Popover,
    TinyTooltip: tinyVue3.Tooltip,
    TinyCol: tinyVue3.Col,
    TinyDropdownItem: tinyVue3.DropdownItem,
    TinyPager: tinyVue3.Pager,
    TinySearch: tinyVue3.Search,
    TinyRow: tinyVue3.Row,
    TinyFormItem: tinyVue3.FormItem,
    TinyAlert: tinyVue3.Alert,
    TinyInput: tinyVue3.Input,
    TinyTabs: tinyVue3.Tabs,
    TinyDropdownMenu: tinyVue3.DropdownMenu,
    TinyDialogBox: tinyVue3.DialogBox,
    TinySwitch: tinyVue3.Switch,
    TinyTimeLine: tinyVue3.TimeLine,
    TinyTabItem: tinyVue3.TabItem,
    TinyRadio: tinyVue3.Radio,
    TinyForm: tinyVue3.Form,
    TinyGrid: tinyVue3.Grid,
    TinyNumeric: tinyVue3.Numeric,
    TinyCheckboxGroup: tinyVue3.CheckboxGroup,
    TinySelect: tinyVue3.Select,
    TinyButtonGroup: tinyVue3.ButtonGroup,
    TinyCarousel: tinyVue3.Carousel,
    TinyPopeditor: tinyVue3.Popeditor,
    TinyDatePicker: tinyVue3.DatePicker,
    TinyDropdown: tinyVue3.Dropdown,
    TinyChartHistogram: tinyVue3.ChartHistogram
  }
  Mapper.TinyTabs.isGroup = true
  Mapper.TinyGrid.isGroup = true
  return Mapper
})
