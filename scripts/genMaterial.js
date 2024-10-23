const baseUrl = 'https://element-plus.org'
const VERSION = '2.7.8'
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const ElementPlus = require('element-plus')
const EMPTY_VALUE = "<null>"
const SCRIPT = 'https://npm.onmicrosoft.cn/element-plus@2.4.2/dist/index.full.mjs';
const ElementPlusIconsVue = require('@element-plus/icons-vue');
// let componentCount = 0;
// 遍历 ElementPlusIconsVue 并根据映射表注册组件及其对应的图标
/* for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  console.log(key)
  componentCount++;
}
console.log(`导出的组件个数: ${componentCount}`); */

/* const map = {AddLocation :'AddLocation图标',Aim :'Aim图标',AlarmClock :'AlarmClock图标',Apple :'Apple图标',ArrowDown :'ArrowDown图标',ArrowDownBold :'ArrowDownBold图标',
            ArrowLeft :'ArrowLeft图标',ArrowLeftBold :'ArrowLeftBold图标',ArrowRight :'ArrowRight图标',ArrowRightBold :'ArrowRightBold图标',ArrowUp :'ArrowUp图标',
            ArrowUpBold :'ArrowUpBold图标',Avatar :'Avatar图标',Back :'Back图标',Baseball :'Baseball图标',Basketball :'Basketball图标',Bell :'Bell图标',
            BellFilled :'BellFilled图标',Bicycle :'Bicycle图标',Bottom :'Bottom图标',BottomLeft :'BottomLeft图标',BottomRight :'BottomRight图标',Bowl :'Bowl图标',
            Box :
  'Box图标',
  Briefcase :
  'Briefcase图标',
  Brush :
  'Brush图标',
  BrushFilled :
  'BrushFilled图标',
  Burger :
  'Burger图标',
  Calendar :
  'Calendar图标',
  Camera :
  'Camera图标',
  CameraFilled :
  'CameraFilled图标',
  CaretBottom :
  'CaretBottom图标',
  CaretLeft :
  'CaretLeft图标',
  CameraFilled :
  'CameraFilled图标',
  CaretBottom :
  'CaretBottom图标',
  CaretLeft :
  'CaretLeft图标',
  CaretRight :
  'CaretRight图标',
  CaretTop :
  'CaretTop图标',
  Cellphone :
  'Cellphone图标',
  ChatDotRound :
  'ChatDotRound图标',
  ChatDotSquare :
  'ChatDotSquare图标',
  ChatLineRound :
  'ChatLineRound图标',
  ChatLineSquare :
  'ChatLineSquare图标',
  ChatRound :
  'ChatRound图标',
  ChatSquare :
  'ChatSquare图标',
  Check :
  'Check图标',
  Checked :
  'Checked图标',
  Cherry :
  'Cherry图标',
  Chicken :
  'Chicken图标',
  ChromeFilled :
  'ChromeFilled图标',
  CircleCheck :
  'CircleCheck图标',
  CircleCheckFilled :
  'CircleCheckFilled图标',
  CircleClose :
  'CircleClose图标',
  CircleCloseFilled :
  'CircleCloseFilled图标',
  CirclePlus :
  'CirclePlus图标',
  CirclePlusFilled :
  'CirclePlusFilled图标',
  Clock :
  'Clock图标',
  Close :
  'Close图标',
  CloseBold :
  'CloseBold图标',
  Cloudy :
  'Cloudy图标',
  Coffee :
  'Coffee图标',
  CoffeeCup :
  'CoffeeCup图标',
  Coin :
  'Coin图标',
  Comment :
  'Comment图标',
  Compass :
  'Compass图标',
  Connection :
  'Connection图标',
  Coordinate :
  'Coordinate图标',
  CopyDocument :
  'CopyDocument图标',
  Cpu :
  'Cpu图标',
  CreditCard :
  'CreditCard图标',
  Crop :
  'Crop图标',
  DArrowLeft :
  'DArrowLeft图标',
  DArrowRight :
  'DArrowRight图标',
  DataAnalysis :
  'DataAnalysis图标',
  DataBoard :
  'DataBoard图标',
  DataLine :
  'DataLine图标',
  DCaret :
  'DCaret图标',
  Delete :
  'Delete图标',
  DeleteFilled :
  'DeleteFilled图标',
  DeleteLocation :
  'DeleteLocation图标',
  Dessert :
  'Dessert图标',
  Discount :
  'Discount图标',
  Dish :
  'Dish图标',
  DishDot :
  'DishDot图标',
  Document :
  'Document图标',
  DocumentAdd :
  'DocumentAdd图标',
  DocumentChecked :
  'DocumentChecked图标',
  DocumentCopy :
  'DocumentCopy图标',
  DocumentDelete :
  'DocumentDelete图标',
  DocumentRemove :
  'DocumentRemove图标',
  Download :
  'Download图标',
  Drizzling :
  'Drizzling图标',
  Edit :
  'Edit图标',
  EditPen :
  'EditPen图标',
  Eleme :
  'Eleme图标',
  ElemeFilled :
  'ElemeFilled图标',
  ElementPlus :
  'ElementPlus图标',
  Expand :
  'Expand图标',
  Female :
  'Female图标',
  Files :
  'Files图标',
  Film :
  'Film图标',
  Filter :
  'Filter图标',
  Finished :
  'Finished图标',
  FirstAidKit :
  'FirstAidKit图标',
  Flag :
  'Flag图标',
  Fold :
  'Fold图标',
  Folder :
  'Folder图标',
  FolderAdd :
  'FolderAdd图标',
  FolderChecked :
  'FolderChecked图标',
  FolderDelete :
  'FolderDelete图标',
  FolderOpened :
  'FolderOpened图标',
  FolderRemove :
  'FolderRemove图标',
  Food :
  'Food图标',
  Football :
  'Football图标',
  ForkSpoon :
  'ForkSpoon图标',
  Fries :
  'Fries图标',
  FullScreen :
  'FullScreen图标',
  Goblet :
  'Goblet图标',
  GobletFull :
  'GobletFull图标',
  GobletSquare :
  'GobletSquare图标',
  GobletSquareFull :
  'GobletSquareFull图标',
  GoldMedal :
  'GoldMedal图标',
  Goods :
  'Goods图标',
  GoodsFilled :
  'GoodsFilled图标',
  Grape :
  'Grape图标',
  Grid :
  'Grid图标',
  Guide :
  'Guide图标',
  Handbag :
  'Handbag图标',
  Headset :
  'Headset图标',
  Help :
  'Help图标',
  HelpFilled :
  'HelpFilled图标',
  Hide :
  'Hide图标',
  IceCream :
  'IceCream图标',
  IceCreamRound :
  'IceCreamRound图标',
  IceCreamSquare :
  'IceCreamSquare图标',
  IceDrink :
  'IceDrink图标',
  IceTea :
  'IceTea图标',
  InfoFilled :
  'InfoFilled图标',
  Iphone :
  'Iphone图标',
  Key :
  'Key图标',
  KnifeFork :
  'KnifeFork图标',
  Lightning :
  'Lightning图标',
  Link :
  'Link图标',
  List :
  'List图标',
  Loading :
  'Loading图标',
  Location :
  'Location图标',
  LocationFilled :
  'LocationFilled图标',
  LocationInformation :
  'LocationInformation图标',
  Lock :
  'Lock图标',
  Lollipop :
  'Lollipop图标',
  MagicStick :
  'MagicStick图标',
  Magnet :
  'Magnet图标',
  Male :
  'Male图标',
  Management :
  'Management图标',
  MapLocation :
  'MapLocation图标',
  Medal :
  'Medal图标',
  Memo :
  'Memo图标',
  Menu :
  'Menu图标',
  Message :
  'Message图标',
  MessageBox :
  'MessageBox图标',
  Mic :
  'Mic图标',
  Microphone :
  'Microphone图标',
  MilkTea :
  'MilkTea图标',
  Minus :
  'Minus图标',
  Money :
  'Money图标',
  Monitor :
  'Monitor图标',
  Moon :
  'Moon图标',
  MostlyCloudy :
  'MostlyCloudy图标',
  Mouse :
  'Mouse图标',
  Mug :
  'Mug图标',
  Mute :
  'Mute图标',
  MuteNotification :
  'MuteNotification图标',
  NoSmoking :
  'NoSmoking图标',
  Notebook :
  'Notebook图标',
  Notification :
  'Notification图标',
  Odometer :
  'Odometer图标',
  OfficeBuilding :
  'OfficeBuilding图标',
  Open :
  'Open图标',
  Operation :
  'Operation图标',
  Opportunity :
  'Opportunity图标',
  Orange :
  'Orange图标',
  Paperclip :
  'Paperclip图标',
  PartlyCloudy :
  'PartlyCloudy图标',
  Pear :
  'Pear图标',
  Phone :
  'Phone图标',
  PhoneFilled :
  'PhoneFilled图标',
  Picture :
  'Picture图标',
  PictureFilled :
  'PictureFilled图标',
  PictureRounded :
  'PictureRounded图标',
  PieChart :
  'PieChart图标',
  Place :
  'Place图标',
  Platform :
  'Platform图标',
  Plus :
  'Plus图标',
  Pointer :
  'Pointer图标',
  Position :
  'Position图标',
  Postcard :
  'Postcard图标',
  Pouring :
  'Pouring图标',
  Present :
  'Present图标',
  PriceTag :
  'PriceTag图标',
  Printer :
  'Printer图标',
  Promotion :
  'Promotion图标',
  QuartzWatch :
  'QuartzWatch图标',
  QuestionFilled :
  'QuestionFilled图标',
  Rank :
  'Rank图标',
  Reading :
  'Reading图标',
  ReadingLamp :
  'ReadingLamp图标',
  Refresh :
  'Refresh图标',
  RefreshLeft :
  'RefreshLeft图标',
  RefreshRight :
  'RefreshRight图标',
  Refrigerator :
  'Refrigerator图标',
  Remove :
  'Remove图标',
  RemoveFilled :
  'RemoveFilled图标',
  Right :
  'Right图标',
  ScaleToOriginal :
  'ScaleToOriginal图标',
  School :
  'School图标',
  Scissor :
  'Scissor图标',
  Search :
  'Search图标',
  Select :
  'Select图标',
  Sell :
  'Sell图标',
  SemiSelect :
  'SemiSelect图标',
  Service :
  'Service图标',
  Setting :
  'Setting图标',
  SetUp :
  'SetUp图标',
  Share :
  'Share图标',
  Ship :
  'Ship图标',
  Shop :
  'Shop图标',
  ShoppingBag :
  'ShoppingBag图标',
  ShoppingCart :
  'ShoppingCart图标',
  ShoppingCartFull :
  'ShoppingCartFull图标',
  ShoppingTrolley :
  'ShoppingTrolley图标',
  Smoking :
  'Smoking图标',
  Soccer :
  'Soccer图标',
  SoldOut :
  'SoldOut图标',
  Sort :
  'Sort图标',
  SortDown :
  'SortDown图标',
  SortUp :
  'SortUp图标',
  Stamp :
  'Stamp图标',
  Star :
  'Star图标',
  StarFilled :
  'StarFilled图标',
  Stopwatch :
  'Stopwatch图标',
  SuccessFilled :
  'SuccessFilled图标',
  Sugar :
  'Sugar图标',
  Suitcase :
  'Suitcase图标',
  SuitcaseLine :
  'SuitcaseLine图标',
  Sunny :
  'Sunny图标',
  Sunrise :
  'Sunrise图标',
  Sunset :
  'Sunset图标',
  Switch :
  'Switch图标',
  SwitchButton :
  'SwitchButton图标',
  SwitchFilled :
  'SwitchFilled图标',
  TakeawayBox :
  'TakeawayBox图标',
  Ticket :
  'Ticket图标',
  Tickets :
  'Tickets图标',
  Timer :
  'Timer图标',
  ToiletPaper :
  'ToiletPaper图标',
  Tools :
  'Tools图标',
  Top :
  'Top图标',
  TopLeft :
  'TopLeft图标',
  TopRight :
  'TopRight图标',
  TrendCharts :
  'TrendCharts图标',
  Trophy :
  'Trophy图标',
  TrophyBase :
  'TrophyBase图标',
  TurnOff :
  'TurnOff图标',
  Umbrella :
  'Umbrella图标',
  Unlock :
  'Unlock图标',
  Upload :
  'Upload图标',
  UploadFilled :
  'UploadFilled图标',
  User :
  'User图标',
  UserFilled :
  'UserFilled图标',
  Van :
  'Van图标',
  VideoCamera :
  'VideoCamera图标',
  VideoCameraFilled :
  'VideoCameraFilled图标',
  VideoPause :
  'VideoPause图标',
  VideoPlay :
  'VideoPlay图标',
  View :
  'View图标',
  Wallet :
  'Wallet图标',
  WalletFilled :
  'WalletFilled图标',
  Warning :
  'Warning图标',
  WarningFilled :
  'WarningFilled图标',
  WarnTriangleFilled :
  'WarnTriangleFilled图标',
  Watch :
  'Watch图标',
  Watermelon :
  'Watermelon图标',
  WindPower :
  'WindPower图标',
  ZoomIn :
  'ZoomIn图标',
  ZoomOut :
  'ZoomOut图标',
} */
const getName = (str) => {

  function isAllEnglishLetters(str) {
    // 使用正则表达式检查字符串是否全是英语字母
    const regex = /^[A-Za-z]+$/;
    return regex.test(str);
  }
  return str.split(' ').filter((s) => isAllEnglishLetters(s)).join("")
};


function snakeToCamel(str) {
  return str
    .split('-') // 将字符串按下划线分割
    .map((word, index) => {
      if (index === 0) {
        return word; // 保持第一个单词小写
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(''); // 将数组重新连接成字符串
}

function createConfigure(params) {
  const Component = params.Component || {};
  let properties = [];
  if (Component.props) {
    properties = Object.keys(Component.props)
  }
  return {
    loop: true,
    condition: true,
    styles: true,
    isContainer: false,
    isModal: false,
    isPopper: false,
    nestingRule: {
      childWhitelist: '',
      parentWhitelist: '',
      descendantBlacklist: '',
      ancestorWhitelist: ''
    },
    isNullNode: false,
    isLayout: false,
    rootSelector: '',
    shortcuts: {
      properties
    },
    contextMenu: {
      actions: ['copy', 'remove', 'insert', 'updateAttr', 'bindEevent', 'createBlock'],
      disable: []
    },
    invalidity: [''],
    clickCapture: true,
    framework: 'Vue'
  }
}
function createNpmConfig(name) {
  return {
    package: 'element-plus',
    version: VERSION,
    script: SCRIPT,
    css: 'https://npm.onmicrosoft.cn/element-plus@2.4.2/dist/index.css',
    dependencies: null,
    exportName: `El${name}`,
    destructuring: true
  }
}

function createWidget(type, key) {
  let component = EMPTY_VALUE
  if (Array.isArray(type) && type.length > 0) {
    type = type[0]
  }
  switch (type) {
    case String:
      component = "MetaInput"
      break;
    case Boolean:
      component = "MetaSwitch"
      break;
    case Function:
      component = "MetaCodeEditor"
      break;
    case Object:
      component = "MetaCodeEditor"
      break;
    case Array:
      component = "MetaCodeEditor"
      break;
    case Number:
      component = "MetaNumber"
      break;
    case Date:
      component = "MetaDatePicker"
      break;

    default:
      break;
  }
  if (component === EMPTY_VALUE) {
    // console.log(type, key)
  }
  return {
    component,
    props: {}
  }
}

function generateFieldMapDesc(tables) {
  const tableNames = []
  for (const table of tables) {
    if (table.bodys) {
      for (const body of table.bodys) {
        const tableName = {
          key: body[0],
          value: body[1],
        }
        if (String(tableName.key).includes(" ")) {
          tableName.key = tableName.key.split(" ")[0]
        }
        if (String(tableName.key).includes("-")) {
          tableName.key = snakeToCamel(tableName.key)
        }
        tableNames.push(tableName)
      }
    }
  }
  return tableNames
}
function prefixWithOn(str) {
  return `on${str.charAt(0).toUpperCase() + str.slice(1)}`;
}

function extractSlotNames(func) {
  // 将函数转换为字符串
  const funcString = func.toString();

  // 使用正则表达式匹配所有 slots.x 的 x
  const regex = /slots\.(\w+)/g;
  const slotNames = new Set(); // 使用 Set 去重

  let match;
  while ((match = regex.exec(funcString)) !== null) {
    slotNames.add(match[1]); // 添加 x 到集合中
  }

  return Array.from(slotNames); // 转换为数组
}

function getLabelName(key, labelName) {
  if (labelName !== EMPTY_VALUE) {
    return labelName
  }
  switch (key) {
    case "a11y":
      labelName = "是否启用无障碍";
      break;
    case "isRange":
      labelName = "设置一个日期范围";
      break;
    case "keyboardNavigation":
      labelName = "是否允许用户通过键盘进行导航";
      break;
    case "disabledHours":
      labelName = "设置不可选择的小时";
      break;
    case "disabledMinutes":
      labelName = "设置不可选择的分钟";
      break;
    case "disabledSeconds":
      labelName = "设置不可选择的秒钟";
      break;
    case "label":
      labelName = "设置组件的标签";
      break;
    case "tabindex":
      labelName = "定义元素的键盘导航顺序";
      break;
    case "ariaLabel":
      labelName = "为无障碍支持设置元素的可访问标签";
      break;
    case "id":
      labelName = "本机输入id";
      break;
    case "containerRole":
      labelName = "容器角色，为选择器组件提供的内部属性";
      break;
    case "role":
      labelName = "容器角色，为选择器组件提供的内部属性";
      break;
    case "popperOptions":
      labelName = "自定义popper选项，详见[popper.js](https://popper.js.org/docs/v2/)";
      break;
    case "validateEvent":
      labelName = "是否触发表单验证";
      break;
    default:
      // 可选的默认情况
      break;
  }


  return labelName;
}

function isContinue(key, name) {
  if (name === "ElTooltip") {
    return ["className", "style", "strategy", "gpuAcceleration", "boundariesPadding", "onUpdate:visible", "pure", "focusOnShow", "trapping", "popperStyle", "referenceEl", "triggerTargetEl", "stopPopperMouseEvent", "zIndex", "onMouseenter", "onMouseleave", "onClick", "onKeydown", "onFocus", "onBlur", "onContextmenu", "open", "arrowOffset"].includes(key)
  }
  if (name === "ElPopover") {
    return ["enterable", "onUpdate:visible"].includes(key)
  }
  if (name === "ElDrawer") {
    return ["center", "alignCenter", "closeIcon", "draggable", "overflow", "fullscreen", "ariaLevel", "top", "width", "trapFocus", "modalFade"].includes(key)
  }
  if (name === "ElTour") {
    return ["gap", "appendTo"].includes(key)
  }
  if (name === "ElTreeSelect") {
    return ["checkDescendants"].includes(key)
  }
  if (name === "ElBadge") {
    return ["dotStyle", "dotClass"].includes(key)
  }
  if (name === "ElTable") {
    return ["style"].includes(key)
  }
  if (name === "ElTree") {
    return ["checkDescendants"].includes(key)
  }
  if (name === "ElDropdown") {
    return ["effect", "loop", "buttonProps"].includes(key)
  }
  if (name === "ElDialog") {
    return ["ariaLevel", "trapFocus"].includes(key)
  }
  return false
}

async function createSchema(params) {
  // 这个函数的作用是：将参数转为
  const result = {
    properties: [],
    events: {},
    slots: {}
  }

  const Component = params.Component;
  const tableNames = generateFieldMapDesc(params.tables);
  if (Component.props) {
    const propertiesKey = Object.keys(Component.props);
    const content = [];
    const properties = {
      label: { zh_CN: "基础信息" },
      description: { zh_CN: "基础信息" },
      collapse: { number: 6, text: { zh_CN: "显示更多" } },
      content,
    }

    for (const key of propertiesKey) {
      const propsValue = Component.props[key]
      const type = typeof propsValue === "function" ? propsValue : propsValue.type ? propsValue.type : propsValue
      const required = (typeof propsValue !== "function") && ("required" in propsValue) ? propsValue["required"] : false
      const defaultValue = (typeof propsValue !== "function") && ("defaultValue" in propsValue) ? propsValue["defaultValue"] : undefined
      let labelName = tableNames?.find(({ key: k }) => k === key || snakeToCamel(k) === key)?.value || EMPTY_VALUE;
      labelName = getLabelName(key, labelName)
      if (isContinue(key, Component.name)) {
        continue
      }
      if (labelName === EMPTY_VALUE) {
        // console.log(key, Component.name)
      }

      const contentObject = {
        property: key,
        label: { text: { zh_CN: labelName } },
        required,
        readOnly: false,
        disabled: false,
        cols: 12,
        widget: createWidget(type, key),
      }
      if (defaultValue != undefined) {
        contentObject["defaultValue"] = typeof defaultValue === "function" ? defaultValue() : defaultValue;
      }
      content.push(contentObject)

    }
    result.properties = properties;
  }

  if (Component.emits) {
    const eventKeys = Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits)
    for (const key of eventKeys) {
      const methodName = prefixWithOn(key)
      let desc = tableNames?.find(({ key: k }) => k === key)?.value || EMPTY_VALUE;
      if (key === "click") {
        desc = "点击时触发"
      }
      if (methodName === "onUpdate:modelValue") {
        desc = "双向绑定的值改变时触发"
      }
      if (desc === EMPTY_VALUE) {
        continue;
      }

      result.events[methodName] = {
        label: {
          zh_CN: desc
        },
        description: {
          zh_CN: desc
        },
        type: "event",
        functionInfo: {
          "params": [],
          "returns": {}
        },
        defaultValue: ""
      }
    }
  }

  if (Component.setup) {
    const list = extractSlotNames(Component.setup);
    for (const key of list) {
      let desc = tableNames?.find(({ key: k }) => k === key)?.value || EMPTY_VALUE;
      // if (desc === EMPTY_VALUE) {
      //   console.log(key, Component.name, "setup")
      // }
      result.slots[key] = {
        label: {
          zh_CN: desc
        },
        description: {
          zh_CN: desc
        }
      }
    }
  }

  return result
}

async function createComponent(param) {
  const cleanedName = param.name.replace(/^\w+\s+/, '')
  const name = getName(param.name)
  const s = await createSchema(param)
  return {
    version: VERSION,
    name: { zh_CN: cleanedName },
    component: param.component_name,
    icon: String(name).toLowerCase(),
    description: param.desc,
    doc_url: '',
    screenshot: '',
    tags: '',
    keywords: '',
    dev_mode: 'proCode',
    npm: createNpmConfig(name),
    group: param.group,
    category: 'element-plus',
    configure: createConfigure(param),
    schema: s
  }
}

async function loadMenuData() {
  const url = 'https://element-plus.org/zh-CN/component/overview.html'
  const response = await axios.get(url)
  // console.log("根节节点请求成功")
  const html = response.data
  const $ = cheerio.load(html)
  const sidebarItems = $('.sidebar-group')
  const data = []

  sidebarItems.each((index, element) => {
    const tagP = $(element).find('.sidebar-group__title')
    const tagAList = $(element).find('a')
    const tagPText = tagP.text()
    tagAList.each((i, item) => {
      const link = `${baseUrl}${$(item).attr('href')}.html`
      const text = $(item).text().trim()
      data.push({ text, link, group: tagPText })
    })
  })
  return data.filter((itemStr) => itemStr.text !== 'Overview 组件总览')
}

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

/**
 * 
 * @param {*} menus 
 * @param {*} concurrency 同时请求的数量
 * @returns 
 */
async function loadBaseDataByMenus(menus, concurrency) {
  const result = [];

  const fetchMenuData = async (menu, retries = 3) => {
    try {
      const response = await axios.get(menu.link, { timeout: 2000 }); // 设置超时时间
      // console.log(menu.text + " 加载成功...");
      const html = response.data;
      const $ = cheerio.load(html);
      const sidebarItems = $('.vp-table');
      const desc = $('h1 + p').text();
      const tables = [];

      let objName = {
        name: menu.text,
        component_name: `El${getName(menu.text)}`,
        desc,
        group: menu.group,
        tables
      };

      sidebarItems.each((index, table) => {
        const thItems = $(table).find('tr th');
        const thtdItems = $(table).find('tr td');
        const prevNodeTitle = $(table).prev().text();
        const headers = [];
        const bodys = [];
        const tableObj = { headers, bodys: [], tableName: prevNodeTitle };

        thItems.each((i, th) => {
          headers.push($(th).text().trim());
        });
        thtdItems.each((i, td) => {
          bodys.push($(td).text().trim());
        });

        const wrapBodys = chunk(bodys, headers.length);
        tableObj.bodys = wrapBodys;
        tables.push(tableObj);
      });

      return objName;

    } catch (error) {
      // console.error(`${menu.text} 加载失败: ${error.message}`);
      if (retries > 0) {
        // console.log(`重试 ${menu.text}... (${3 - retries + 1})`);
        return fetchMenuData(menu, retries - 1); // 递归调用以重试
      } else {
        throw new Error(`${menu.text} 加载失败，已重试 ${3} 次`);
      }
    }
  };

  for (let i = 0; i < menus.length; i += concurrency) {
    const chunkedMenus = menus.slice(i, i + concurrency);
    const responses = await Promise.all(chunkedMenus.map(menu => fetchMenuData(menu)));
    result.push(...responses);
  }

  return result;
}



function generateJSONFile(jsonData, fileName = 'output.json', filePath = './') {
  const jsonString = JSON.stringify(jsonData, null, 2)
  const fullFilePath = filePath.endsWith('/') ? filePath + fileName : filePath + '/' + fileName
  fs.writeFile(fullFilePath, jsonString, 'utf8', (err) => {
    if (err) {
      console.error('写入文件时出错：', err)
    } 
    else {
       console.log(`JSON 数据已成功写入到文件 ${fullFilePath}`)
    }
  })
}

async function generateComponent(params) {
  const components = []

  for (let i = 0; i < params.length; i++) {
    let param = params[i]

    const c = await createComponent(param)
    const component = {
      id: components.length + 1,
      ...c,
    }
    components.push(component)
  }
  return components
}

/* async function generateSnippets(params) {
  const snippets = []
  const snippetChildrens = []
  for (let i = 0; i < params.length; i++) {
    const param = params[i]

    const snippetChildren = {
      name: { zh_CN: param?.name?.['zh_CN'] || EMPTY_VALUE },
      icon: param.icon, // Default icon, you can customize it
      screenshot: '', // Screenshot URL or path, if available
      snippetName: param.component,
      schema: {} // Schema structure, populate as needed
    }
    snippetChildrens.push(snippetChildren)
  }

  const snippet = {
    group: 'element-plus',
    children: snippetChildrens
  }

  snippets.push(snippet)

  return snippets
} */

async function generateSnippets(params) {
    const snippets = [];
    const snippetChildrens = [];
    
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
  
      // 根据组件名称进行 icon 替换
      let iconName = param.icon; // 默认的 icon
  
      // 根据组件名称进行条件判断
      if (param.component === 'ElButton') {
        iconName = 'button'; // 替换为 assets 目录下的文件名
      } else if (param.component === 'ElContainer') {
        iconName = 'breadcrumb'; //布局容器
      } else if (param.component === 'ElIcon') {
        iconName = 'icon'; 
      } else if (param.component === 'ElLink') {
        iconName = 'link'; 
      } else if (param.component === 'ElText') {
        iconName = 'text'; 
      } else if (param.component === 'ElScrollbar') {
        iconName = 'expand'; 
      } else if (param.component === 'ElSpace') {
        iconName = 'overflow-scroll'; 
      } else if (param.component === 'ElConfigProvider') {
        iconName = 'plugin-icon-language'; 
      } else if (param.component === 'ElAutocomplete') {
        iconName = 'plus-circle'; 
      } else if (param.component === 'ElCascader') {
        iconName = 'transform-origin-center'; 
      } else if (param.component === 'ElCheckbox') {
        iconName = 'checkbox'; 
      } else if (param.component === 'ElColorPicker') {
        iconName = 'tablefilter'; 
      } else if (param.component === 'ElDatePicker') {
        iconName = 'datepick'; 
      } else if (param.component === 'ElForm') {
        iconName = 'form'; 
      } else if (param.component === 'ElInput') {
        iconName = 'input'; 
      } else if (param.component === 'ElInputNumber') {
        iconName = 'numeric'; 
      } else if (param.component === 'ElMention') {
        iconName = 'text-page-review'; 
      } else if (param.component === 'ElRadio') {
        iconName = 'radio'; 
      } else if (param.component === 'ElRate') {
        iconName = 'edit'; 
      } else if (param.component === 'ElSelect') {
        iconName = 'select'; 
      } else if (param.component === 'ElSlider') {
        iconName = 'flex-alignbaselinerow'; 
      } else if (param.component === 'ElSwitch') {
        iconName = 'switch'; 
      } else if (param.component === 'ElTimePicker') {
        iconName = 'realtime-flow'; 
      } else if (param.component === 'ElTimeSelect') {
        iconName = 'accordion'; 
      } else if (param.component === 'ElTransfer') {
        iconName = 'align-content-center'; 
      } else if (param.component === 'ElTreeSelect') {
        iconName = 'tree'; 
      } else if (param.component === 'ElUpload') {
        iconName = 'unfold-outline'; 
      } else if (param.component === 'ElAvatar') {
        iconName = 'stars'; 
      } else if (param.component === 'ElBadge') {
        iconName = 'flowchart-rds'; 
      } else if (param.component === 'ElCalendar') {
        iconName = 'bdlayout'; 
      } else if (param.component === 'ElCard') {
        iconName = 'dialogbox'; 
      } else if (param.component === 'ElCarousel') {
        iconName = 'carousel'; 
      } else if (param.component === 'ElCollapse') {
        iconName = 'collapse'; 
      } else if (param.component === 'ElDescriptions') {
        iconName = 'grid-row-auto'; 
      } else if (param.component === 'ElEmpty') {
        iconName = 'empty'; 
      } else if (param.component === 'ElImage') {
        iconName = 'image'; 
      } else if (param.component === 'ElInfiniteScroll') {
        iconName = 'full-screen'; 
      } else if (param.component === 'ElPagination') {
        iconName = 'flex-justifyspace-betweenrow'; 
      } else if (param.component === 'ElProgress') {
        iconName = 'tile-x'; 
      } else if (param.component === 'ElResult') {
        iconName = 'flow-success'; 
      } else if (param.component === 'ElSkeleton') {
        iconName = 'chat-minimize'; 
      } else if (param.component === 'ElTable') {
        iconName = 'table'; 
      } else if (param.component === 'ElTag') {
        iconName = 'tag'; 
      } else if (param.component === 'ElTimeline') {
        iconName = 'timeline'; 
      } else if (param.component === 'ElTour') {
        iconName = 'checkout'; 
      } else if (param.component === 'ElTree') {
        iconName = 'tree-shape'; 
      } else if (param.component === 'ElStatistic') {
        iconName = 'plugin-icon-data'; 
      } else if (param.component === 'ElSegmented') {
        iconName = 'align-content-space-around'; 
      } else if (param.component === 'ElAffix') {
        iconName = 'cancel-full-screen'; 
      } else if (param.component === 'ElAnchor') {
        iconName = 'clock-small'; 
      } else if (param.component === 'ElBacktop') {
        iconName = 'unfold-outline'; 
      } else if (param.component === 'ElBreadcrumb') {
        iconName = 'breadcrumb'; 
      } else if (param.component === 'ElDropdown') {
        iconName = 'dropdown'; 
      } else if (param.component === 'ElMenu') {
        iconName = 'menu'; 
      } else if (param.component === 'ElPageHeader') {
        iconName = 'text-page-common'; 
      } else if (param.component === 'ElSteps') {
        iconName = 'position-top'; 
      } else if (param.component === 'ElTabs') {
        iconName = 'tabs'; 
      } else if (param.component === 'ElAlert') {
        iconName = 'alert'; 
      } else if (param.component === 'ElDialog') {
        iconName = 'chat-maximize'; 
      } else if (param.component === 'ElDrawer') {
        iconName = 'collection'; 
      } else if (param.component === 'ElLoading') {
        iconName = 'loading'; 
      } else if (param.component === 'ElMessage') {
        iconName = 'chat-message'; 
      } else if (param.component === 'ElMessageBox') {
        iconName = 'cloud-shell'; 
      } else if (param.component === 'ElNotification') {
        iconName = 'warning'; 
      } else if (param.component === 'ElPopconfirm') {
        iconName = 'flowchart-evs'; 
      } else if (param.component === 'ElPopover') {
        iconName = 'popover'; 
      } else if (param.component === 'ElTooltip') {
        iconName = 'tooltip'; 
      } else if (param.component === 'ElDivider') {
        iconName = 'border-style-solid'; 
      } else if (param.component === 'ElWatermark') {
        iconName = 'carouselitem'; 
      } 
  
      const snippetChildren = {
        name: { zh_CN: param?.name?.['zh_CN'] || EMPTY_VALUE },
        icon: iconName, // 使用更新后的 icon
        screenshot: '', // Screenshot URL or path, if available
        snippetName: param.component,
        schema: {} // Schema structure, populate as needed
      };
  
      snippetChildrens.push(snippetChildren);
    }
  
    const snippet = {
      group: 'element-plus',
      children: snippetChildrens
    };
  
    snippets.push(snippet);
  
    return snippets;
  }
  

async function generateMaterial(params) {
  const components = await generateComponent(params)
  const blocks = []
  const snippets = await generateSnippets(components)
  const result = {
    framework: 'Vue',
    materials: {
      components,
      blocks,
      snippets
    }
  }
  return result
}

// function mergeParamTables(to, from, param, params) {
//   if (param.component_name === to) {
//     const waitParam = params.find(({ component_name }) => component_name === from);
//     if (waitParam) {
//       param.tables = [...param.tables, ...waitParam.tables]
//     }
//   }
//   return param
// }

async function mergeComponent(params) {
  const newArr = []
  const ep = ElementPlus
  for (const param of params) {
    const component_name = param.component_name
    if (!ep[component_name]) {
      continue
    }
    const newObj = {
      ...param,
      Component: ep[component_name],
    }
    newArr.push(newObj)
  }
  for (const param of params) {
    const component_name = param.component_name
    if ("ElDateTimePicker" === component_name) {
      for (let i = 0; i < newArr.length; i++) {
        const element = newArr[i];
        if (element.component_name === "ElDatePicker") {
          newArr[i].tables = [...newArr[i].tables, ...param.tables]
        }
      }
      for (let i = 0; i < newArr.length; i++) {
        const element = newArr[i];
        if (element.component_name === "ElTimePicker") {
          newArr[i].tables = [...newArr[i].tables, ...param.tables]
        }
      }
    }
    if ("ElSelect" === component_name) {
      for (let i = 0; i < newArr.length; i++) {
        const element = newArr[i];
        if (element.component_name === "ElTreeSelect") {
          newArr[i].tables = [...newArr[i].tables, ...param.tables]
        }
      }
    }
    if ("ElTree" === component_name) {
      for (let i = 0; i < newArr.length; i++) {
        const element = newArr[i];
        if (element.component_name === "ElTreeSelect") {
          newArr[i].tables = [...newArr[i].tables, ...param.tables]
        }
      }
    }
  }
  return newArr
}

async function main() {
  try {
    // 获取官网的组件列表
    let menus = await loadMenuData()
    // 获取官网的组件信息
    const x = await loadBaseDataByMenus(menus, 10)
    let newMenus = await mergeComponent(x)
    const m = await generateMaterial(newMenus)
    generateJSONFile({ data: m }, 'bundle.json', './')
  } catch (error) {
    // console.error('Error in main function:', error)
  }
}

main()
