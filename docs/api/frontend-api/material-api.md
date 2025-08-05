# 物料模块 API

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
    displayComponentIds: ['engine.plugins.materials.component', 'engine.plugins.materials.block'], // 需要展示的Tab组件ID列表，可以为单个，单个的时候，不展示tab，直接显示该元应用
    basePropertyOptions, //基础属性配置
    hiddenBuiltinMaterials: [] // 隐藏的内置物料组件列表，配置的组件不会在物料面板中显示
  },
  components: {
    header: MaterialHeader // 公共组件，可自行提供
  },
  apis: { ...MaterialBlock.apis }, // 当前元应用暴露出来的api
  metas: [MaterialBlock, MaterialComponent, ResourceService, MaterialService] // 当前元应用里依赖的元应用和元服务
}

export { entry, ResourceService, MaterialService }
```

### 物料插件配置选项详解

#### hiddenBuiltinMaterials 配置

用于隐藏不需要在物料面板中显示的内置组件，提高物料面板的整洁性和用户体验。

**配置示例：**

```js
// registry.js
export default {
  [META_APP.Materials]: {
    options: {
      hiddenBuiltinMaterials: [
        'Box', // 盒子容器（普通div 容器）
        'CanvasRowColContainer', // 行列容器
        'CanvasFlexBox', // 弹性容器
        'CanvasSection', // 全宽居中容器
        'Text', // 文本
        'Icon', // 图标
        'Img', // 图片
        'Slot', // 插槽（区块插槽需要）
        'RouterView', // 路由视图（子页面需要，不建议隐藏）
        'RouterLink', // 路由链接
        'Navigation', // 导航条
        'NavigationV', // 纵向导航条
        'Collection' // 数据源容器（数据源功能依赖，不建议隐藏）
      ]
    }
  }
}
```

**使用场景：**

- 隐藏不常用的内置组件，简化物料面板
- 根据项目需求定制显示的组件列表

### 物料插件元应用暴露出来的 API

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

1. `materialState`：reactive 对象，存放物料插件面板里的状态数据，包括组件、区块、第三方依赖等，具体数据结构如下：

```js
const materialState = reactive({
  components: [], // 这里存放的是物料插件面板里所有显示的组件
  blocks: [], // 这里存放的是物料插件面板里所有显示的区块
  componentsDepsMap: { scripts: [], styles: new Set() }, // 这里存放组件依赖的映射
  packages: [] // 物料依赖的包
})
```

**使用示例**

`useMaterial().materialState`

2. 暴露出来的方法函数详情

```js
{
  // 状态对象
  materialState, // 存放着组件、物料侧区块、第三方依赖信息
    // 初始化和请求方法
    initMaterial, // 物料模块初始化，参数: { isInit = true, appData = {} }
    fetchMaterial, // 请求物料并进行处理
    refreshMaterial, // 刷新物料，清空后重新初始化和获取
    // 物料资源获取方法
    getMaterialsRes, // 获取物料，并返回符合物料协议的bundle.json内容，返回: Promise<Materials>
    getMaterial, // 获取单个物料，参数: (name: string) => Material
    getComponentsByGroup, // 根据组名获取指定分组组件，参数: (components: Component[], groupName: string) => Component[]
    // 物料操作方法
    generateNode, // 根据包含{ type, component }的组件信息生成组件schema节点
    setMaterial, // 设置单个物料，参数: (name: string, data: Material) => void
    addMaterials, // 添加多个物料，参数: (materials: Material) => void
    // 物料清理方法
    clearMaterials, // 清空所有物料
    clearBlockResources, // 清空区块缓存，以便更新最新版区块
    getBlockByName, // 通过区块名称获取区块
    getBlockCompileRes, // 获取区块编译结果
    addBlockResources, // 增加区块缓存，参数: (id: string, resource: BlockResource) => void
    updateBlockCompileCache, // 更新区块编译缓存
    // 依赖相关方法
    getCanvasDeps, // 组装画布依赖，包含物料和工具类的依赖
    updateCanvasDeps, // 通知画布更新依赖
    // 配置相关方法
    getConfigureMap // 获取物料组件的配置信息，返回组件名到配置的映射
}
```

**使用示例**

```js
// 初始化物料
useMaterial().initMaterial({ isInit: true, appData }) // appData为远程拉取的应用数据

// 获取单个物料
const material = useMaterial().getMaterial('ComponentName')

// 生成组件节点
const node = useMaterial().generateNode({ type: 'component', component: 'Button' })

// 刷新物料
await useMaterial().refreshMaterial()
```

#### 主要 API 详解

##### 初始化和请求相关方法

1. `initMaterial`：初始化物料模块

```js
/**
 * 初始化物料模块，设置组件映射，处理依赖
 * @param {object} options - 初始化选项
 * @param {boolean} options.isInit - 是否为首次初始化，默认为true
 * @param {object} options.appData - 应用数据，包含组件映射等信息
 */
initMaterial({ isInit = true, appData = {} })
```

2. `fetchMaterial`：请求并处理物料

```js
/**
 * 请求物料数据并进行处理，将物料添加到系统中
 * @returns {Promise<void>}
 */
fetchMaterial()
```

3. `refreshMaterial`：刷新物料

```js
/**
 * 刷新物料，先清空所有物料，再重新初始化和请求
 * @returns {Promise<void>}
 */
refreshMaterial()
```

使用场景：二开工程中，允许用户上传物料，或者是动态更新物料后，需要刷新物料，此时可以调用该方法。

##### 物料资源获取方法

1. `getMaterialsRes`：获取物料资源

```js
/**
 * 获取物料，并返回符合物料协议的bundle.json内容
 * @returns {Promise<Material[]>} - 返回物料数据数组
 */
getMaterialsRes()
```

2. `getMaterial`：获取单个物料

```js
/**
 * 获取单个物料信息
 * @param {string} name - 物料名称
 * @returns {Partial<Resource & BlockResource>} - 返回物料信息
 */
getMaterial(name)
```

3. `getComponentsByGroup`：按组获取组件

```js
/**
 * 根据组名获取指定分组下的组件
 * @param {Component[]} components - 组件列表
 * @param {string} groupName - 组名
 * @returns {Component[]} - 返回组内的组件
 */
getComponentsByGroup(components, groupName)
```

##### 物料操作方法

1. `generateNode`：生成组件节点

```js
/**
 * 根据组件信息生成组件schema节点
 * @param {object} params - 组件参数
 * @param {string} params.type - 组件类型，如'component'或'block'
 * @param {string} params.component - 组件名称
 * @returns {Schema} - 返回组件Schema
 */
generateNode({ type, component })
```

2. `setMaterial`：设置单个物料

```js
/**
 * 设置单个物料信息
 * @param {string} name - 物料名称
 * @param {Resource} data - 物料数据
 */
setMaterial(name, data)
```

3. `addMaterials`：添加多个物料

```js
/**
 * 添加多个物料到系统中
 * @param {Material} materials - 物料包数据
 */
addMaterials(materials)
```

##### 区块相关方法

1. `addBlockResources`：添加区块资源

```js
/**
 * 增加区块缓存
 * @param {string} id - 区块ID(即label字段)
 * @param {BlockResource} resource - 区块资源信息
 */
addBlockResources(id, resource)
```

##### 依赖管理方法

1. `getCanvasDeps`：获取画布依赖

```js
/**
 * 获取画布所需的依赖
 * @returns {object} - 返回包含scripts和styles的对象
 */
getCanvasDeps()
```

2. `updateCanvasDeps`：更新画布依赖

```js
/**
 * 通知画布更新依赖
 */
updateCanvasDeps()
```

使用场景：如果需要画布刷新 script 或者 import-map 的时候，可以调用此方法让画布重新加载。（该方法会调用 getCanvasDeps 方法，获取画布依赖，并通知画布更新依赖）

#### 物料类型结构

主要的物料类型定义包括：

1. `Material`: 物料包定义，符合物料协议的 bundle.json 内容

```ts
interface Material {
  components: Component[] // 组件列表
  blocks?: Block[] // 区块列表
  snippets?: Snippet[] // 物料分组列表
  packages?: Dependency[] // 物料依赖的包
}
```

2. `Component`: 组件物料定义

```ts
interface Component {
  component: string // 组件名称
  group: string // 组件分组
  npm?: {
    // 组件NPM包信息
    package: string // 包名
    script?: string // 脚本路径
    exportName: string // 导出名称
    css?: string // 样式路径
  }
  schema?: Schema // 组件配置信息
}
```

3. `Block`: 区块物料定义

```ts
interface Block {
  label: string // 区块标识
  blockName: string // 区块名称
  version?: string // 区块版本
  description?: string // 区块描述
  screenshot?: string // 区块截图
  content?: BlockResource // 区块内容
}
```

#### 使用场景示例

1. 初始化物料并加载到系统

```js
import { useMaterial } from '@opentiny/tiny-engine'

// 初始化物料
export const initApp = async (appData) => {
  const material = useMaterial()
  // 初始化物料，传入应用数据
  material.initMaterial({ isInit: true, appData })
  // 请求并处理物料
  await material.fetchMaterial()
  // 更新画布依赖
  material.updateCanvasDeps()
}
```

2. 创建新组件并添加到画布

```js
import { useMaterial, useCanvas } from '@opentiny/tiny-engine'

export const addComponent = (componentName) => {
  const material = useMaterial()
  const canvas = useCanvas()

  // 生成组件节点
  const schema = material.generateNode({
    type: 'component',
    component: componentName
  })

  // 添加到画布
  canvas.canvasApi.value.addComponent(schema)
}
```

3. 获取物料配置信息

```js
import { useMaterial } from '@opentiny/tiny-engine'

export const getComponentConfigure = (componentName) => {
  const material = useMaterial()

  // 获取单个物料信息
  const componentInfo = material.getMaterial(componentName)

  // 获取组件配置
  const configureMap = material.getConfigureMap()
  const configure = configureMap[componentName]

  return { componentInfo, configure }
}
```

4. 刷新物料

```js
import { useMaterial } from '@opentiny/tiny-engine'

export const handleUploadMaterial = async (material) => {
  // 1. 允许用户上传物料
  getMetaApi(META_SERVICE.Http).post('xxx/upload', material)
  // 2. 刷新物料, 让画布重新加载，并在物料插件更新列表。
  const material = useMaterial()
  await material.refreshMaterial()
}
```
