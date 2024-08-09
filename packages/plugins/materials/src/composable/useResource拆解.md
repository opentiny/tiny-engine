# useResource

## useResource 原本的作用
1. 存放 resState
2. 获取appData，设置resState
3. 初始化物料
4. 初始化当前画布页面或者区块
5. 暴露popState事件，可以重新初始化当前画布页面或者区块

## 原本api

### fetchResource

#### 作用
    1. 获取appData
    2. 用appData初始化或者刷新state
    3. 调用useMaterial.initMaterial初始化物料模块（仅在初始化时执行，后续刷新不会调用）
    4. 初始化当前画布显示的页面或者区块 initPageorBlock（仅在初始化时执行，后续刷新不会调用）
    5. 刷新i18n
   
#### 在哪里被调用
    1. app.vue 在canvas ready后，作为资源初始化，当在canvas ready之后调用时，会去调用`useMaterial.initMaterial`, `initPageorBlock`
    2. BlockGroupPanel 在新增消费的区块时调用，只会请求appData，刷新对应的全局数据和i18n。

### handlePopStateEvent

#### 作用
    1. 能够在路由发生改变时init当前的页面和block
    2. 刷新i18n
   
#### 在哪里被调用
    1. app.vue 绑定pop state的事件监听
   
## 可改造的点
1. 有两个功能相对独立：1. 和全局appData相关 2. 初始化当前画布页面、区块，可以把两个独立的功能分开
2. 利用数据流的通信，将appData获取后发送事件通知
3. 由于useMaterial.initMaterial初始化物料模块只会在canvas ready时执行，将fetchResource调用useMaterial.initMaterial初始化物料模块提出到app.vue中，解耦useMaterial。
4. 由于initPageorBlock 初始化画布页面模块只会在canvas ready时执行，将 fetchResource调用 initPageorBlock 抽取出来，同2一样，使用事件通信
5. 将 handlePopStateEvent 抽取出来
6. 看一下APP.vue是一个什么样的角色，如果app.vue里可以调用上面的几个元服务，那么2，3，4都可以直接写在app.vue中。


**因此将其拆分成2个元服务以及将部分功能进行提取**

元服务

- useAppData 作为存放全局数据（来源appData）
- usePageBlockSchema 作为初始化当前画布页面或者区块

功能提取

- 提取fetchResource里调用useMaterial.initMaterial初始化物料模块，解耦useMaterial。直接在design-core app.vue里调用。
- 提取fetchResource里调用 initPageorBlock 初始化物料模块，直接在design-core app.vue里调用。


## useAppData

### 元服务用途
 初始化全局APP数据（来源appData），以及初始化i18n。

### state
```js

const appDataState = reactive({
  dataSource: [], // 数据源
  pageTree: [], // 大纲数
  langs: {}, // i18n
  utils: {}, // 工具类
  globalState: [] // 全局信息
  willFetch: {}, // 数据源默认拦截器
  dataHandler: {}, //  数据源默认拦截器
  errorHandler: {}, // 数据源默认拦截器
  bridge: {}, // 桥接源
  isDemo: false,
})

```
### api 

#### fetchAppData
##### 作用
    请求APP全局数据，并返回AppData
   
##### 在哪里被调用
    被当前的initAppData直接调用
   
#### initAppData

##### 作用
   初始化APP全局数据, 并返回AppData
   
##### 在哪里被调用
    1. app.vue 在canvas ready之后，作为app全局数据初始化
    2. BlockGroupPanel 在新增消费的区块时调用，用作刷新相关数据

### 遗留修改项
1. 利用数据流的通信，将appData获取后发送事件通知，initAppData不返回appData
2. 当前这个元服务还依赖useApp, useTranslate, useEditorInfo, 可能要看此元服务的归属点（放置哪个文件），以及这些依赖项是否可以拆解，是否可以通过传参注入。
3. 需要定位一下appDataState.currentLang（原：resState.currentLang）是什么，从哪里来的，原来的代码没发现赋值的地方。
4. 在canvas container里还有直接对 appDataState.globalState进行赋值的操作

## usePageBlockSchema

### 元服务用途
    作为初始化当前画布页面或者区块

### state

无

### api

#### handlePopStateEvent

##### 作用
    1. 作为pop state的监听处理事件，能够在路由发生改变时init当前的页面和block
    2. 刷新i18n
   
##### 在哪里被调用
    1. app.vue 绑定pop state的事件监听
   
#### initPageOrBlock


##### 作用
    1. init当前的页面和block
   
##### 在哪里被调用
    1. pop state的事件监听handlePopStateEvent里
    2. design-core app.vue，获取到appData后，初始化当前的页面或者当前block

### 遗留修改项

1. 看是否需要将handlePopStateEvent提取出来，也放在app.vue里，这里取决于app.vue的定位。如果放在app.vue里的话，当前这个元服务不需要依赖useTranslate，但是需要在app.vue引入useTranslate。
   
2. 当前这个元服务还依赖以下元服务，首先要看此元服务应该放置在哪层目录下，然后是否能够将 initPage的部分，initBlock的部分抽取出来，在app.vue作为初始化事件通知他们各自的元服务，去各自进行初始化操作。这样就能将useBlock进行解耦。但是其他的如：`useCanvas`，`useEditorInfo`，`useBreadcrumb`，`useLayout` 作为initPage，initBlock的基础元服务，得进一步分析解耦。

``` js
  useCanvas,
  useTranslate,
  useEditorInfo,
  useBreadcrumb,
  useLayout,
  useBlock,
 ```
   