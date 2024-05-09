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
  CarouselItem,
  CheckboxButton,
  Tree,
  Popover,
  Tooltip,
  Col,
  DropdownItem,
  Pager,
  Search,
  Row,
  FormItem,
  Alert,
  Input,
  Tabs,
  DropdownMenu,
  DialogBox,
  Switch,
  TimeLine,
  TabItem,
  Radio,
  Form,
  Grid,
  Numeric,
  CheckboxGroup,
  Select,
  ButtonGroup,
  Carousel,
  Popeditor,
  DatePicker,
  Dropdown,
  ChartHistogram
} from '@opentiny/vue'
const Mapper = {
  TinyCarouselItem: CarouselItem,
  TinyCheckboxButton: CheckboxButton,
  TinyTree: Tree,
  TinyPopover: Popover,
  TinyTooltip: Tooltip,
  TinyCol: Col,
  TinyDropdownItem: DropdownItem,
  TinyPager: Pager,
  TinySearch: Search,
  TinyRow: Row,
  TinyFormItem: FormItem,
  TinyAlert: Alert,
  TinyInput: Input,
  TinyTabs: Tabs,
  TinyDropdownMenu: DropdownMenu,
  TinyDialogBox: DialogBox,
  TinySwitch: Switch,
  TinyTimeLine: TimeLine,
  TinyTabItem: TabItem,
  TinyRadio: Radio,
  TinyForm: Form,
  TinyGrid: Grid,
  TinyNumeric: Numeric,
  TinyCheckboxGroup: CheckboxGroup,
  TinySelect: Select,
  TinyButtonGroup: ButtonGroup,
  TinyCarousel: Carousel,
  TinyPopeditor: Popeditor,
  TinyDatePicker: DatePicker,
  TinyDropdown: Dropdown,
  TinyChartHistogram: ChartHistogram
}
Mapper.TinyTabs.isGroup = true
Mapper.TinyGrid.isGroup = true
export { Mapper as default }
