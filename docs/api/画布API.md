# 画布模块API

### 元服务useCanvas

- `statePageState`：提供reactive对象`statePageState`，描述页面状态主数据，具体数据结构如下：

```
{
 currentVm: null,
 currentSchema: null, // 当前画布渲染的schema
 currentType: null,
 pageSchema: null, // 当前画布的原始页面数据
 properties: null,
 dataSource: null,
 dataSourceMap: null,
 isSaved: boolean,// 画布的修改是否已经保存， 修改后未推送到后端为false， 推送后端保存成功后为true
 isLock: boolean,// 画布是否锁定
 isBlock: boolean,// 画布加载的是否是区块
 nodesStatus: {},
 loading: boolean // 画布是否加载中
//隐藏属性  currenetPage
}
```

-  ` isCanvasApiReady`： ref对象，判断画布是否初始化完成， 画布初始化前值为false，初始化后值为true
- useCanvas对外暴露出的API方法函数如下：

```
  isBlock, //  方法函数， 单次获取pageState.isBlock值， 非响应式

  isSaved,//  方法函数， 单次获取pageState.isSaved值， 非响应式

  isLoading, // 方法函数，单次获取pageState.loading值， 非响应式

  initData, // 方法函数，初始化页面数据后调用该函数来刷新pageState的值

  setSaved, // 方法函数, 设设置为已经保存

  clearCanvas, // 方法函数，清空画布（保留文件名和区块名， 其他pageState.pageSchema重置并设置为已经保存）

  getPageSchema,//方法函数，单次获取pageState.currentSchema值 ，如果不存在返回空对象， 非响应式，

  resetPageCanvasState,// 方法函数 重置画布数据并且设置为页面（isBlock=false）

  resetBlockCanvasState, // 方法函数 重置画布数据并且设置为区块（isBlock=true）

  clearCurrentState, // 方法函数，清理pageState以下属性属性currentVm、hoverVm、properties、pageSchema

  getCurrentSchema, //方法函数，单次获取pageState.currentSchema值， 非响应式，

  setCurrentSchema, //方法函数，单次设置pageState.currentSchema

  getCurrentPage,// 方法函数，单次获取pageState.currentPage值， 非响应式，（ 默认没有定义currentPage，好像是函数硬塞进来的）

  initCanvasApi, // 方法函数， 用于画布初始化完后，调用该函数登记canvasApi
```

- `canvasApi` ：  ref对象，存放了可以对画布进行操作的方法函数，画布初始化后才有值， 如下

  ```
  {
  
   dragStart, // 方法函数，开始拖拽方法，设置上下文
  
   updateRect,// 方法函数，更新选中框的大小
  
   getContext, // 转接的方法， 调用render的setDataSourceMap
  
   getNodePath, // 方法函数，递归获取节点的路径 直到body层
  
   dragMove,// 方法函数，拖拽中的方法，设置上下文
  
   setLocales, // 方法函数，重置/补充I18n词条
  
   setState,,// 转接的方法， 调用render的setState
  
   deleteState, // 转接的方法， 调用render的deleteState
  
   getRenderer, // 方法函数，获取renderer
  
   clearSelect, // 方法函数，清空画布内部选中状态
  
   selectNode,// 方法函数，设置画布内部选中的元素为node
  
   hoverNode,// 方法函数，设置画布内部悬停的元素为node
  
   insertNode,// 方法函数，画布内插入一个node，可选before after等位置
  
   removeNode,// 方法函数，画布内移除一个node
  
   addComponent,// 方法函数，画布内插入一个物料里的组件
  
   setPageCss,// 方法函数，画布设置页面/区块的全局css， 如果不存在会新增style标签，如果存在会刷新style标签的内容
  
   addScript, // 方法函数 给画布添加脚本，用于物料解析后添加脚本 （后面可能改为importMap 可能就没用了）
  
   addStyle,// 方法函数 给画布添加CSS，用于物料解析后添加css
  
   getNode,// 转接的方法， 调用render的getNode
  
   getCurrent, // 方法函数  返回canvasState的current/parent/loopId, 当前数据
  
   setSchema,// 转接的方法， 调用render的setSchema
  
   setUtils,// 转接的方法， 调用render的setUtils
  
   updateUtils,// 转接的方法， 调用render的updateUtils
  
   deleteUtils, // 转接的方法， 调用render的deleteUtils
  
   getSchema,// 转接的方法， 调用render的getSchema
  
   setI18n,
  
   getCanvasType, // 方法函数 获取canvas的类型
  
   setCanvasType,// 方法函数 设置canvas的类型，并且会设置画布body的样式名
  
   setProps,
  
   setGlobalState, // 方法函数，设置resouce的resState的globalState, 然后调用render的setGlobalState方法
  
   getGlobalState,// 转接的方法， 调用render的setDataSourceMap
  
   getDocument, // 方法函数，返回画布iframe的contentDcocument
  
   canvasDispatch,// 方法函数，在画布内document层派发一个事件
  
   Builtin, // json对象， 画布内建物料的json
  
   setDataSourceMap // 转接的方法， 调用render的setDataSourceMap
  
   getDataSourceMap// 转接的方法， 调用render的getDataSourceMap
  
  }
  ```



### renderer对象（来自画布实例）

```
{
  getApp, //方法函数， 放回当前画布的vue实例app
  getI18n //方法函数， 放回当前画布vue实例初始化后的TinyI18nHost
  getUtils, // 方法函数， 返回存放的utils
  setUtils, // 方法函数，设置数据到内置存放的utils
  updateUtils,// 方法函数，追加utils
  deleteUtils,// 方法函数，删除特定的utils
  getBridge, // 方法函数, 返回存放的bridge
  setBridge,// 方法函数, 设置数据到内置存放的bridge
  getMethods, //下同，全部为设置和存放
  setMethods, 
  setController,
  setConfigure,
  getSchema,
  setSchema,
  getState,
  deleteState,
  setState,
  getProps,
  setProps,
  getContext,
  getNode,
  getRoot,
  setPagecss,
  setCondition,
  getGlobalState,
  getDataSourceMap,
  setDataSourceMap,
  setGlobalState
}
```



