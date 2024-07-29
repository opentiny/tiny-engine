# useResource
## state
```js
const resState = reactive({
  dataSource: [], // 数据源
  pageTree: [], // 大纲数
  langs: {}, // i18n
  utils: {}, // 工具类
  globalState: [] // 全局信息
})

```

## api

### fetchResource

#### 作用
    1. 获取appData
    2. 用appData初始化或者刷新state
    3. 调用useMaterial.initMaterialModule初始化物料模块
    4. 初始化当前画布显示的页面或者区块 initPageorBlock
    5. 刷新i18n
#### 在哪里被调用
    1. app.vue 在canvas ready后，作为资源初始化
    2. BlockGroupPanel 在新增消费的区块时调用，用作刷新相关数据

### handlePopStateEvent
#### 作用
    1. 能够在路由发生改变时init当前的页面和block
    2. 刷新i18n
#### 在哪里被调用
    1. app.vue 绑定pop state的事件监听
   
## 可改造的点（数据流解决后）
    1. 利用数据流的通信，将appData获取后发送事件通知
    2. 将fetchResource调用useMaterial.initMaterialModule初始化物料模块提出，解耦useMaterial。
    3. 将 fetchResource调用 initPageorBlock 抽取出来，同2一样，使用事件通信
    4. 将 handlePopStateEvent 抽取出来
    5. 看一下APP.vue是一个什么样的角色，如果app.vue里可以调用上面的几个元服务，那么2，3，4都可以直接写在app.vue中。
   