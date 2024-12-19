# 物料模块API
## 物料插件元应用

```js
export default {
  id: 'engine.plugins.materials', // 元应用id
  title: '物料', // 元应用名称
  type: 'plugins', // 元应用类型 
  icon: 'plugin-icon-materials', // 元应用图标
  align: 'top', // 元应用在当前类型下的位置
  entry, // 入口文件
  layout: MaterialLayout, // 布局文件，可替换布局
  options: {
    defaultTabId: 'engine.plugins.materials.component', //  默认激活的Tab的元应用ID
    displayComponentIds: ['engine.plugins.materials.component', 'engine.plugins.materials.block'],  // 需要展示的Tab组件ID列表，可以为单个，单个的时候，不展示tab，直接显示该元应用
    basePropertyOptions //基础属性配置
  },
  components: {
    header: MaterialHeader // 公共组件，可自行提供
  },
  apis: { ...MaterialBlock.apis }, // 当前元应用暴露出来的api
  metas: [MaterialBlock, MaterialComponent, ResourceService, MaterialService] // 当前元应用里依赖的元应用和元服务
}

export { entry, ResourceService, MaterialService }

```

### 物料插件元应用暴露出来的API
```js
  apis: {
    fetchGroups: fetchGroups // 获取区块分组列表
  }
```

## 物料模块元服务
### useResource 元服务

负责全局统一的资源管理，如：国际化、大纲树、工具类、全局状态，全局数据源

```js
const resState = reactive({
  dataSource: [],
  pageTree: [],
  langs: {},
  utils: {},
  globalState: []
})


return {
  resState, // 保存着整个tiny-engine的国际化、大纲树、工具类、全局状态，全局数据源数据
  fetchResource, // 进行初始化，获取后端返回的资源信息
  initPageOrBlock, // 初始化页面或区块
  handlePopStateEvent //被app.vue主应用调用 ，可以用来进行页面、区块的刷新和国际化的重新初始化
}
```

### useMaterial 元服务

负责物料插件的管理，如：物料数据，物料插件的初始化、物料插件的请求、物料插件的处理、物料插件的清空、物料插件的添加、物料插件的注册、物料插件的依赖更新等

#### API

1. `materialState`：reative 对象，存放物料插件面板里的状态数据，包括组件、区块、第三方依赖等，具体数据结构如下：

```js

const materialState = reactive({
  components: [], // 这里存放的是物料插件面板里所有显示的组件
  blocks: [],  // 这里存放的是物料插件面板里所有显示的区块
  thirdPartyDeps: { scripts: [], styles: new Set() }  // 这里存放的是物料第三方依赖相关信息
})

```
> **使用示例**
>
> ```useMaterial().materialState```


2. 暴露出来的方法函数如下

```js
{
    initMaterial, // 物料模块初始化
    fetchMaterial, // 请求物料并进行处理
    getMaterialsRes, // 获取物料，并返回符合物料协议的bundle.json内容，getMaterialsRes: () =>  Promise<Materials>
    generateNode, // 根据 包含{ type, componentName }的组件信息生成组件schema节点，结构：
    clearMaterials, // 清空物料
    clearBlockResources, // 清空区块缓存，以便更新最新版区块
    getMaterial, // 获取单个物料，(property) getMaterial: (name: string) => Material
    setMaterial, // 设置单个物料 (property) setMaterial: (name: string, data: Material) => void
    addMaterials, // 添加多个物料
    registerBlock, // 注册新的区块
    updateCanvasDependencies, //传入新的区块，获取新增区块的依赖，更新画布中的组件依赖
    getConfigureMap // 获取物料组件的配置信息
  }
```
> **使用示例**
>
> ```useMaterial().initMaterial({ isInit: true, appData }) // appData为远程拉取的应用数据```