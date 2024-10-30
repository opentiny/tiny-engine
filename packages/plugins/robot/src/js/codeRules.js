export const codeRules = `\`\`\`
问题:生成符合 TinyEngine Schema 格式 Schema代码
背景:需要使用我给出的TinyVue组件生成满足TinyEngine的Schema格式的代码
请扮演一名前端开发专家，根据前端需求使用 TinyVue 组件库生成 Vue3 代码。请使用正确的 TinyVue 组件示例，确保生成代码完全符合 TinyEngine 的 Schema 格式。生成代码时严格遵循以下要求：

1.  组件使用限制：
  •只使用提供的 TinyVue 组件示例代码中的组件进行代码编写，不能引入其他组件或封装，禁止自己编造组件。
  •代码仅限于一个代码块输出。
2. 命名规范：
  •所有组件遵循首字母大写的命名规则，如 TinyForm, TinyFormItem, Text 等。
3. 组件选择和匹配：
  •细致分析页面的每个功能区域，使用最贴合的 TinyVue 组件。
   例如，表格组件是用 Grid 表格,表单区使用 TinyForm 和 TinyFormItem，按钮使用 TinyButton，模态框使用 TinyModal, 搜索使用 TinySearch。
  •各区域组件应与最合适的 TinyVue 组件匹配，以最大程度还原页面的预期样式与功能效果。
4. 页面布局：
  •页面分为主标题区、导航栏、内容展示区、操作按钮区等。使用 TinyVue 布局组件（如TinyContainer,TinyRow, TinyCol），结合 Flex 布局，实现响应式布局适配各类屏幕尺寸。
5. 样式细节：
  •确保页面视觉效果与参考样式一致，包含背景色、阴影、边框和动画。按钮、卡片和表单元素需具备悬停动画和边框样式。
  •确保组件间距、字体、颜色与参考页面保持一致。
6. 交互效果：
  •页面需包含完整的交互效果。按钮悬停时可放大或变色，表单输入时显示验证提示，模态框需带关闭按钮和背景遮罩。
7. 代码完整性：
  •提供详细的代码，包括 TinyVue 组件的所有属性、事件绑定、样式配置，确保代码能展示出功能齐全的页面效果。
步骤

1. 我将给你一段正确使用 TinyVue 组件的代码示例，里面包括了 TinyVue 现有哪些组件及如何使用。在根据需求正确选用TinyVue的组件生成代码,注意：不一定全部组件都要使用。
以下是正确使用TinyVue组件示例代码:
<template>
  <div class="tiny-page">
    <!-- Container 容器布局 -->
    <div class="demo-container">
      <div class="option-row">
        <span class="tip">选择版型：</span>
        <tiny-radio-group v-model="pattern">
          <tiny-radio label="default">默认:default</tiny-radio>
        </tiny-radio-group>
      </div>
      <tiny-container :pattern="pattern">
        <div class="demo-center">Main</div>
      </tiny-container>
    </div>

    <!-- Layout 栅格布局 -->
    <div class="content">
      <tiny-layout :cols="12">
        <tiny-row>
          <tiny-col :span="6">
            <div class="col">span 6</div>
          </tiny-col>
          <tiny-col :span="6">
            <div class="col">span 6</div>
          </tiny-col>
        </tiny-row>
      </tiny-layout>
    </div>

    <!-- Link 链接 -->
    <div>
      <tiny-link @click="handleClick">默认链接</tiny-link>
    </div>

    <!-- Divider 分割线 -->
    <tiny-divider></tiny-divider>

    <!-- ActionMenu 动作菜单 -->
    <tiny-action-menu :options="options"></tiny-action-menu>

    <!-- Breadcrumb 面包屑 -->
    <tiny-breadcrumb @select="breadcrumbClick">
      <tiny-breadcrumb-item :to="{ path: '/' }" label="首页"></tiny-breadcrumb-item>
      <tiny-breadcrumb-item>
        <a href="/">产品</a>
      </tiny-breadcrumb-item>
      <tiny-breadcrumb-item :to="{ path: '/breadcrumb' }">软件</tiny-breadcrumb-item>
    </tiny-breadcrumb>

    <!-- Dropdown 下拉菜单 -->
    <tiny-dropdown>
      <template #dropdown>
        <tiny-dropdown-menu>
          <tiny-dropdown-item>老友粉</tiny-dropdown-item>
          <tiny-dropdown-item>黄金糕</tiny-dropdown-item>
        </tiny-dropdown-menu>
      </template>
    </tiny-dropdown>

    <!-- NavMenu 导航菜单 -->
    <div class="preview">
      <tiny-nav-menu :data="menuData"></tiny-nav-menu>
    </div>

    <!-- Steps 步骤条 -->
    <tiny-steps line :data="stepsData" :active="active" @click="handleClick"></tiny-steps>

    <!-- Tabs 页签 -->
    <tiny-tabs v-model="activeName">
      <tiny-tab-item title="表单组件" name="first">表单组件</tiny-tab-item>
      <tiny-tab-item title="数据组件" name="second" disabled>数据组件</tiny-tab-item>
    </tiny-tabs>

    <!-- Cascader 级联选择器 -->
    <tiny-cascader v-model="cascaderValue" :options="cascaderOptions" :props="{ emitPath: false }"></tiny-cascader>

    <!-- Checkbox 多选框 -->
    <tiny-checkbox v-model="checkboxValue" name="tiny-checkbox">复选框</tiny-checkbox>

    <!-- FileUpload 文件上传 -->
    <tiny-file-upload :data="fileUploadData" ref="uploadRef" :action="action">
      <template #trigger>
        <tiny-button type="primary">点击上传</tiny-button>
      </template>
    </tiny-file-upload>

    <!-- Form 表单 -->
    <tiny-form label-width="100px">
      <tiny-form-item label="数字">
        <!-- Numeric 数字输入框 -->
        <tiny-numeric v-model="formValue.quantity"></tiny-numeric>
      </tiny-form-item>
      <tiny-form-item label="单选">
        <!-- Radio 单选框 -->
        <tiny-radio v-model="formValue.sex" label="1">男</tiny-radio>
        <tiny-radio v-model="formValue.sex" label="2">女</tiny-radio>
      </tiny-form-item>
      <tiny-form-item label="日期">
        <!-- DatePicker 日期选择器 -->
        <tiny-date-picker v-model="formValue.datepicker"></tiny-date-picker>
      </tiny-form-item>
      <tiny-form-item label="时间">
        <!-- DropTimes 下拉时间 -->
        <tiny-drop-times v-model="formValue.dropTimes"></tiny-drop-times>
      </tiny-form-item>
      <tiny-form-item label="文本">
        <!-- Input 输入框 -->
        <tiny-input v-model="formValue.input" placeholder="click"></tiny-input>
      </tiny-form-item>
      <tiny-form-item>
        <!-- Button 按钮 -->
        <tiny-button type="primary" @click="submitForm">提交</tiny-button>
      </tiny-form-item>
    </tiny-form>
    
    <!-- ButtonGroup 按钮组 -->
    <div>
      <tiny-button-group :data="groupData" v-model="checkedVal"></tiny-button-group>
      <div class="mt-12">当前选中值：{{ checkedVal }}</div>
    </div>

    <!-- Search 搜索 -->
    <div>
      <tiny-search v-model="searchValue" placeholder="请输入关键词" :maxlength="10"></tiny-search>
      <div class="mt10">当前搜索值为：{{ searchValue }}</div>
    </div>

    <!-- Select 选择器 -->
    <div>
      <div>选中的值为： {{ selectValue }}</div>
      <tiny-select v-model="selectValue">
        <tiny-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value"></tiny-option>
      </tiny-select>
    </div>

    <!-- Slider 滑块 -->
    <div>
      <tiny-button @click="setValue">设置值</tiny-button>
      <tiny-slider v-model="sliderValue"></tiny-slider>
    </div>

    <!-- Switch 开关 -->
    <tiny-switch v-model="switchValue"></tiny-switch>

    <!-- TimePicker 时间选择器 -->
    <div class="demo-date-picker-wrap">
      <tiny-time-picker v-model="timePickerValue"></tiny-time-picker>
    </div>

    <!-- TimeSelect 时间选择 -->
    <div class="time-select-demo-basic">
      <tiny-time-select v-model="timeSelectValue" placeholder="选择时间"></tiny-time-select>
    </div>

    <!-- Grid 表格组件 -->
    <tiny-grid :data="gridData" border :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true}" :pager="pagerConfig">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column type="selection" width="60"></tiny-grid-column>
      <tiny-grid-column field="employees" title="员工数"></tiny-grid-column>
      <tiny-grid-column field="createdDate" title="创建日期" sortable></tiny-grid-column>
      <tiny-grid-column field="city" title="城市"></tiny-grid-column>
      <tiny-grid-column field="boole" title="布尔值" align="center" format-text="boole" :editor="checkboxEdit"></tiny-grid-column>
      <tiny-grid-column title="操作" width="100">
      <template #default="data">
        <div class="demo-custom-column">
          <tiny-button size="mini" @click="clickHandler(data.row)">保存</tiny-button>
          <!-- Icon 图标 -->
          <tiny-icon-search class="tiny-svg-size" @click="clickHandler(data.row)"></tiny-icon-search>
          <tiny-icon-edit class="tiny-svg-size" @click="clickHandler(data.row)"></tiny-icon-edit>
          <tiny-icon-share></tiny-icon-share>
          <tiny-icon-del></tiny-icon-del>
        </div>
      </template>
    </tiny-grid-column>
    </tiny-grid>
    
    
    <!-- Badge 标记 -->
    <tiny-badge :value="2" data="我的待办"></tiny-badge>

    <!-- Calendar 日历 -->
    <tiny-calendar></tiny-calendar>

    <!-- Card 卡片 -->
    <div class="card-wrap">
      <tiny-card title="这是卡片标题" type="image" :src="url">
        <p>
          这是一段长文本内容，这是一段长文本内容，这是一段长文本内容，这是一段长文本内容，
        </p>
      </tiny-card>
    </div>

    <!-- Carousel 走马灯 -->
    <tiny-carousel height="150px">
      <tiny-carousel-item class="carousel-item-demo" v-for="item in 4" :key="item">
        <h3>{{ item }}</h3>
      </tiny-carousel-item>
    </tiny-carousel>

    <!-- Collapse 折叠面板 -->
    <tiny-collapse v-model="activeNames">
      <tiny-collapse-item title="一致性 Consistency" name="1">
        <div>与现实生活一致：与现实生活的流程、逻辑保持一致，遵循用户习惯的语言和概念；</div>
      </tiny-collapse-item>
      <tiny-collapse-item title="反馈 Feedback" name="2">
        <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
      </tiny-collapse-item>
    </tiny-collapse>

    <!-- Image 图片 -->
    <div class="basic-container">
      <div v-for="fit in fits" :key="fit">
        <div class="title">{{ fit }}</div>
        <tiny-image :src="url" :fit="fit"></tiny-image>
      </div>
    </div>

    <!-- Statistic 统计数值 -->
    <div>
      <tiny-layout>
        <tiny-row :flex="true">
          <tiny-col :span="8">
            <tiny-statistic :value="num" :precision="0"></tiny-statistic>
          </tiny-col>
          <tiny-col :span="8">
            <tiny-statistic :value="num" :precision="2"></tiny-statistic>
          </tiny-col>
        </tiny-row>
      </tiny-layout>
    </div>

    <!-- Tag 标签 -->
    <div class="tiny-tag-demo">
      <tiny-tag size="medium">中等标签</tiny-tag>
      <tiny-tag>默认标签</tiny-tag>
    </div>

    <!-- Timeline 时间线 -->
    <tiny-time-line :data="timeLineData" :active="active1" @click="timeLineClick"></tiny-time-line>

    <!-- UserHead 用户头像 -->
    <tiny-user-head type="icon" :model-value="tinyIconSmile"></tiny-user-head>

    <!-- Alert 警告 -->
    <div>
      <tiny-alert description="type 为默认值 info"></tiny-alert>
      <tiny-alert type="error" description="type 为 error"></tiny-alert>
    </div>

    <!-- DialogBox 对话框 -->
    <div>
      <tiny-button @click="dialogBoxVisibility = true" title="弹出 Dialog">弹出 Dialog</tiny-button>
      <tiny-dialog-box v-model:visible="dialogBoxVisibility" title="消息" width="30%">
        <span>dialog-box 内容</span>
        <template #footer>
          <tiny-button type="primary" @click="dialogBoxVisibility = false">确定</tiny-button>
          <tiny-button @click="dialogBoxVisibility = false">取消</tiny-button>
        </template>
      </tiny-dialog-box>
    </div>

    <!-- Drawer 抽屉 -->
    <div>
      <tiny-button @click="drawerVisibility = true" type="primary">抽屉组件</tiny-button>
      <tiny-drawer title="标题" :visible="drawerVisibility" @update:visible="drawerVisibility = $event" @confirm="drawerConfirm">
        <div style="padding: 32px">内容区域</div>
      </tiny-drawer>
    </div>

    <!-- Loading 加载 -->
    <div>
      <tiny-button @click="closeLoading">close Loading</tiny-button>
      <div id="tiny-basic-loading1"></div>
    </div>

    <!-- Modal 模态框 -->
    <div class="content">
      <tiny-button @click="baseModalClick">基本提示框</tiny-button>
      <tiny-button @click="successModalClick">成功提示框</tiny-button>
    </div>

    <!-- Notify 通知 -->
    <div class="content">
      <tiny-button @click="handleNotifyClick">弹出提示框</tiny-button>
    </div>

    <!-- PopConfirm 气泡确认框 -->
    <div>
      <tiny-popconfirm :title="popConfirmTitle" :message="popConfirmMessage">
        <template #reference>
          <tiny-button>悬浮我提示</tiny-button>
        </template>
      </tiny-popconfirm>
    </div>

    <!-- Popover 气泡卡片 -->
    <tiny-popover placement="top-start" title="标题" content="这是一段内容。" width="200">
      <template #reference>
        <tiny-button>点击我提示</tiny-button>
      </template>
    </tiny-popover>

    <!-- ToolTip 文字提示 -->
    <tiny-tooltip class="item" effect="dark" content="Bottom Center 提示文字" placement="bottom">
      <tiny-button>下边</tiny-button>
    </tiny-tooltip>
  </div>
</template>

<script setup>
import {
  Button as TinyButton,
  ButtonGroup as TinyButtonGroup,
  Layout as TinyLayout,
  Row as TinyRow,
  Container as TinyContainer,
  Radio as TinyRadio,
  RadioGroup as TinyRadioGroup,
  IconShare,
  IconDel,
  Link as TinyLink,
  Divider as TinyDivider,
  ActionMenu as TinyActionMenu,
  Switch as TinySwitch,
  Breadcrumb as TinyBreadcrumb,
  BreadcrumbItem as TinyBreadcrumbItem,
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  DropdownItem as TinyDropdownItem,
  NavMenu as TinyNavMenu,
  Steps as TinySteps,
  Tabs as TinyTabs,
  TabItem as TinyTabItem,
  Cascader as TinyCascader,
  Checkbox as TinyCheckbox,
  DatePicker as TinyDatePicker,
  DropTimes as TinyDropTimes,
  FileUpload as TinyFileUpload,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Numeric as TinyNumeric,
  Input as TinyInput,
  Search as TinySearch,
  Select as TinySelect,
  Option as TinyOption,
  Slider as TinySlider,
  TimePicker as TinyTimePicker,
  TimeSelect as TinyTimeSelect,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Badge as TinyBadge,
  Calendar as TinyCalendar,
  Card as TinyCard,
  Carousel as TinyCarousel,
  CarouselItem as TinyCarouselItem,
  Collapse as TinyCollapse,
  CollapseItem as TinyCollapseItem,
  Image as TinyImage,
  Statistic as TinyStatistic,
  Tag as TinyTag,
  TimeLine as TinyTimeLine,
  UserHead as TinyUserHead,
  Alert as TinyAlert,
  DialogBox as TinyDialogBox,
  Drawer as TinyDrawer,
  Loading,
  Modal,
  Notify,
  PopConfirm as TinyPopconfirm,
  Popover as TinyPopover,
  Tooltip as TinyTooltip
} from '@opentiny/vue'
import { ref } from 'vue'
import { iconMinus, iconPlus, iconSmile, iconEdit, iconSearch } from '@opentiny/vue-icon'

// Icon 图标数据
const TinyIconShare = IconShare()
const TinyIconDel = IconDel()
const TinyIconEdit = iconEdit()
const TinyIconSearch = iconSearch()

// Container 布局数据
const pattern = ref('default')

// Link 链接数据
function handleClick() {
  console.log('clicked')
}

// ButtonGroup 数据
const checkedVal = ref('Button1')
const groupData = ref([
  { text: 'Button1', value: 'Button1' },
  { text: 'Button2', value: 'Button2' }
])

// ActionMenu 动作菜单数据
const options = ref([
  {
    label: '远程登陆'
  },
  {
    label: '开机'
  }
])

// Breadcrumb 面包屑数据
function breadcrumbClick(value) {
  console.log('Breadcrumb clicked', value)
}

// NavMenu 导航菜单数据
const menuData = ref([
  {
    title: '首页',
    url: ''
  },
  {
    title: '指南',
    url: '',
    children: [
      {
        title: '引入组件',
        url: '',
        children: [
          {
            title: '按需引入',
            url: ''
          }
        ]
      }
    ]
  }
])

// Steps 步骤条数据
const active = ref(1)
const stepsData = ref([
  {
    name: 'Basic Info',
    status: 'done',
    description: 'done 已完成'
  },
  { name: 'BOQ Info', status: 'doing', description: 'doing 处理中' }
])

// Tabs 页签数据
const activeName = ref('first')

// Cascader 级联选择器数据
const cascaderValue = ref('anzhuangcli')
const cascaderOptions = ref([
  {
    value: 'zhinan',
    label: '指南',
    children: [
      {
        value: 'anzhuang',
        label: '安装',
        children: [
          {
            value: 'xiangmudengji',
            label: '项目登记'
          }
        ]
      }
    ]
  }
])

// Checkbox 多选框数据
const checkboxValue = ref(true)
// FileUpload 文件上传数据
const fileUploadData = ref({
  id: 123
})
const action = ref('http://localhost:3000/api/upload')

// Form 表单数据
const formValue = reactive({
  quantity: 0,
  sex: '1',
  datepicker: '',
  textarea: '',
  dropTimes: '',
  input: ''
})
function submitForm() {
  console.log('Form submitted', formValue)
}

// Search 搜索数据
const searchValue = ref('默认值')

// Select 选择器数据
const selectValue = ref('')
const selectOptions = ref([
  { value: '选项1', label: '北京' },
  { value: '选项2', label: '上海' }
])

// Slider 滑块数据
const sliderValue = ref(20)
function setValue() {
  sliderValue.value = 50
}

// Switch 开关数据
const switchValue = ref(true)

// TimePicker 时间选择器数据
const timePickerValue = ref(new Date(2016, 9, 10, 18, 40))

// TimeSelect 时间选择数据
const timeSelectValue = ref('')

// Grid 表格数据
const gridData = reactive([
  {
    id: '1',
    name: 'GFD科技YX公司',
    city: '福州',
    employees: 800,
    createdDate: '2014-04-30 00:56:00',
    boole: false
  },
  {
    id: '2',
    name: 'WWW科技YX公司',
    city: '深圳',
    employees: 300,
    createdDate: '2016-07-08 12:36:22',
    boole: true
  }
])

// Grid表格中Pager 分页数据：如果不配置 {component: Pager} 则默认使用内置的分页组件。
const pagerConfig = ref({
  attrs: {
    currentPage: 1,
    pageSize: 5,
    pageSizes: [5, 10],
    total: 50,
    align: 'right', // 可选值：['left', 'center', 'right']
    layout: 'total, prev, pager, next, jumper, sizes'
  }
})

function checkboxEdit(h, { row }) {
  return (
      <input
          type="checkbox"
          checked={row.boole}
          onChange={(event) => {
            row.boole = event.target.checked
          }}
      />
  )
}

//Grid表格操作
function clickHandler(row) {
  Modal.message({ message: JSON.stringify(row), status: 'success' })
}

// Collapse 折叠面板数据
const activeNames = ref(['1'])

// Image 图片数据
const fits = ref(['fill', 'contain'])
const url = ref('') //图片链接

// Statistic 统计数值数据
const num = ref(306526.23)

// Timeline 时间线数据
const timeLineData = ref([
  { name: '已下单', time: '2019-11-11 00:01:30' },
  { name: '运输中', time: '2019-11-12 14:20:15' }
])

const active1 = ref(1)
function timeLineClick(index, node) {
  active1.value = index
  console.log('Timeline clicked', index, node)
}

// UserHead 用户头像数据
const tinyIconSmile = iconSmile()

// DialogBox 对话框数据
const dialogBoxVisibility = ref(false)

// Drawer 抽屉数据
const drawerVisibility = ref(false)

function drawerConfirm() {
  drawerVisibility.value = false
}

// Loading 加载数据
const loadingInstance = ref(null)

onMounted(() => {
  loadingInstance.value = Loading.service({
    target: document.getElementById('tiny-basic-loading1')
  })
})

// Modal 模态框数据
function baseModalClick() {
  const modal = Modal.alert('基本提示框', '标题')
  setTimeout(() => modal.vm.close(), 3000)
}

function successModalClick() {
  Modal.alert({ message: '成功提示框', status: 'success' })
}

// Notify 通知数据
function handleNotifyClick() {
  Notify({
    type: 'info',
    title: (h, params) => <h4>通知消息的标题</h4>,
    message: '通知消息的正文，通知消息的正文，通知消息的正文，通知消息的正文，通知消息的正文，通知消息的正文',
    position: 'top-right',
    duration: 5000,
    customClass: 'my-custom-cls'
  })
}

// PopConfirm 气泡确认框数据
const popConfirmTitle = ref('这是气泡标题')
const popConfirmMessage = ref('这是气泡确认框提示内容文本描述，这是两行内容的展示样式，文本内容很长很长。')
</script>
<style scoped>
.mt-12 { margin-top: 12px; }
</style>

2.
2.1.任务：根据下方 Schema 配置模板，将生成 Schema 代码。
2.2.预设 Schema 配置模板说明：模板包含了各字段的基础结构，展示了组件配置的标准格式及各项的含义。请确保生成的 Schema 代码遵循以下结构：
(1)顶层结构必须包含以下字段： state, methods, componentName, css, props, children, fileName
(2)字段解释：以下是对预定 Schema 配置模板中每个部分的详细解释：
1.state 对象：
用途：state 对象用于存储响应式数据。状态管理面板负责系统管理 state 中的响应式变量，包括添加、删除、搜索和编辑操作。
注意事项：
  当使用 state 存储组件需要展示的数据时，必须在对象的属性中内置 type 和 value，并将 value 绑定到属性值。
  步骤：
  1. 首先在state内部定义一个属性值：
  "state": {
    "tableData": [
      {
        "id": "1",
        "name": "GFD科技有限公司"
      },
      {
        "id": "2",
        "name": "WWW科技有限公司"
      }
    ]
  }
  2. 在需要展示数据的字段中引用该属性：
  错误示例：
  "componentName": "TinyGrid",
  "props": {
    "data": "state.tableData",
    "border": true
  },
  正确示例：
  "componentName": "TinyGrid",
  "props": {
    "data": {
      "type": "JSExpression",
      "value": "this.state.tableData"
    }
  }
2.methods 对象：
用途：定义组件的方法，这些方法可以是事件处理器、工具函数或任何其他逻辑。
例如：在模板中定义一个 handleSubmit 方法，它将在表单提交时被调用。
3.componentName：
用途：指定根组件的名称，这是渲染的顶层组件。
例如："componentName": "Page" 表示根组件名为 "Page"。
4.css：
用途：定义组件的样式，可以是内联样式或外部样式表的引用。
例如："css": "body { background-color: #fff; }" 将直接在组件中应用该 CSS 样式。
5.props：
用途：定义组件的属性，这些属性可以由父组件传递给子组件。
例如："props": { "myProp": "someValue" } 定义了一个名为 myProp 的属性，其值为 someValue。
6.children 数组：
用途：定义组件的子组件，这些子组件可以有自己的 componentName、props、id 和 children。
例如："children": [{ "componentName": "TinyForm", ... }] 定义了一个名为 "TinyForm" 的子组件。
注意：确保数组的完整性，不要忘记结尾写"]"，而不是"}".
7.fileName：
用途：定义生成的文件名，通常用于标识或保存组件的代码。
例如："fileName": "registration" 表示生成的文件名为 "registration"。
8.id 属性：
用途：为组件或元素指定一个唯一的标识符，通常用于样式应用、事件处理或DOM操作。
例如："id": "formContainer" 为一个 div 元素定义了一个 ID 为 "formContainer"。
9.props 对象内的属性：
用途：用于定义组件可以接受的外部属性（即参数），这些属性可以是静态的（固定值）或动态的（可变化的数据）。通过props，父组件可以控制子组件的行为或外观，而无需直接修改子组件的内部状态。
例如："props": { "placeholder": "请输入用户名" } 定义了一个名为 placeholder 的属性，其值为 "请输入用户名"。
注意：
· 在书写上不要包含特殊字符，如"@"、":"等等
  示例：
  错误写法："props": { "@click": "resetForm" }"
  正确写法："props": { "click": "resetForm" }"
· 按钮文本作为 props 属性：若在组件（如按钮）上添加显示文字，不应在 props 外部定义，应包含在 props 中。
  示例：
  错误写法：{
    "componentName": "TinyButton",
    "props": {
      "type": "primary",
      "onClick": "submitForm"
    },
    "text": "提交",
    "id": "33424764"
  }
  正确写法：{
    "componentName": "TinyButton",
    "props": {
      "text": "提交",
      "type": "primary",
      "onClick": "submitForm"
    },
    "id": "33424764"
  }
提示： 模板中的每个字段是预定义的，可以根据需求进行填充或修改。例如，处理表单数据时，可在 state 中添加字段，或在 methods 中添加验证逻辑。

2.3.示例 Schema 配置模板：
{
  "state": {
    "dataDisk": []
  },
  "methods": {},
  "componentName": "Page",
  "css": "",
  "props": {},
  "children": [
    {
      "componentName": "div",
      "props": {
        "style": ""
      },
      "id": "",
      "children": [
        {
          "componentName": "TinyForm",
          "props": {
            "labelWidth": "80px",
            "labelPosition": "top",
            "inline": false,
            "label-position": "left",
            "label-width": "150px",
            "style": ""
          },
          "id": "",
          "children": [
            {
              "componentName": "TinyFormItem",
              "props": {
                "label": "",
                "style": ""
              },
              "id": "",
              "children": [
                {
                  "componentName": "TinyButtonGroup",
                  "props": {
                    "data": [],
                    "modelValue": ""
                  },
                  "id": ""
                }
              ]
            }
          ]
        }
      ]
    }
  ],//必不可少，要保证代码的完整性
  "fileName": "" //顶层结构必须包含该字段
}

需求如下：
\`\`\``
