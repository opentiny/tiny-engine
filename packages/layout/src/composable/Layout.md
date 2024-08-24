# Layout

## useLayout 的作用
1.存放画布大小、缩放、类型相关数据  
2.布局数据的获取方法  
3.插件、属性面板显隐设置  
4.画布判空


### state
```js
const layoutState = reactive({
  dimension: {
    deviceType: String, // 设备类型
    width: String, // 画布默认宽度
    maxWidth: String, // 画布最大宽度
    minWidth: String, // 画布小宽度
    scale: Number, // 缩放的比例
    height: String // 画布默认高度
  },
  plugins: {
    fixedPanels: [], // 需要固定面板的插件id列表
    render: String, // 当前激活插件的id，如'engine.plugins.materials'
    pluginEvent: String // 控制插件面板pointer-event属性的值
  },
  settings: {
    render: String, // 当前激活settings面板的name，如'props','event'等
    api: null, // 目前似乎没有使用
    activating: false, // settings面版激活提示状态
    showDesignSettings: true // 控制settings面板是否展示。目前只在数据源的全屏查看时为false
  },
  toolbars: {
    visiblePopover: false // 目前似乎没有使用
  },
  pageStatus: '' // 页面状态，分别有'release','occupy','lock','guest','empty','p_webcenter','developer'
})
```

### apis

#### getScale
##### 作用
    获取缩放的比例数据，canvas容器中，iframe以及iframe之外的元素clientRect的尺寸都是缩放过的，除以scale得到原始大小
##### 在哪里被调用
    1.CanvasAction中调用
    2.CanvasResizeBorder中调用


#### getPluginState
##### 作用
     获取插件状态数据的方法，数据包括固定面板的插件id列表、当前激活的插件id、控制插件面板pointer-event属性的值
##### 在哪里被调用
    1.CanvasResize中被监听
    2.DesignPlugins中关于插件面板的使用
    3.新手引导调整插件面板是否能被点击的调用


#### getDimension
##### 作用
    获取画布大小、缩放、类型相关数据
##### 在哪里被调用
    1.CanvasResize调用
    2.Canvas布局获取scale调用
    3.media工具获取设备数据调用


#### setDimension
##### 参数
    data // 画布大小、缩放、类型相关数据
##### 作用
    设置画布大小、缩放、类型相关数据
##### 在哪里被调用
    1.CanvasResize调用
    2.media工具获取设备数据调用


#### activeSetting
##### 参数
    name //激活settings面板的name，如'props','event'等
##### 作用
    1.激活setting面板
    2.高亮提示
    3.记录当前激活settings的name
##### 在哪里被调用
    1.画布右键Menus的修改属性和绑定事件触发


#### activePlugin
##### 参数
    name // 激活插件的id，如'engine.plugins.materials'
    noActiveRender // false激活 true不激活
##### 作用
    1.激活plugin面板
    2.高亮提示
    3.记录当前激活plugin的id
    4.返回当前插件注册的Api
##### 在哪里被调用
    1.国际化管理调用
    2.设置区块暴露属性调用
    3.区块管理事件/属性调用
    4.新建区块后，激活物料
    5.新手引导激活
    6.绑定事件定位到代码调用
    7.画布刷新调用
    8.工具栏的区块/页面设置调用
    

#### closePlugin
##### 参数
    forceClose // true强制关闭
##### 作用
    关闭插件面板
##### 在哪里被调用
    1.画布拖拽的时候调用
    2.画布选择节点的时候调用
    3.插件面板/锁定面板的关闭图标调用
    4.区块保存/切换
    5.新建页面成功
    6.切换页面并获取页面详情成功后调用


#### isEmptyPage
##### 作用
    判断当前页面是否为空
##### 在哪里被调用
    1.出码
    2.预览
    3.画布刷新
    4.工具栏的区块/页面设置调用

## options

```js
options: {
    configProvider: [], // 全局配置组件
    configProviderDesign: [], // 规范，可以通过该属性定制一些自定义的交互规范
    isShowLine: true, // 是否显示工具栏右侧分割线
    isShowCollapse: true, // 是否显示工具栏右侧下拉列表
    toolbars: {
      left: [],
      center: [],
      right: [],
      collapse: []
    } // 工具栏布局配置，可自定义组件在左、中、右、下拉列表的位置；其中right和collapse为二维数组，可定制分组
  }
```

## 遗留修改项
    1.目前获取layoutState.plugins大部分都是直接从属性获取，还未整改为从api获取，即getPluginState()