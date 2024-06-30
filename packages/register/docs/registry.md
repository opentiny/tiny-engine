# 注册表

默认注册表会注册设计器的全部功能。自定义设计器时，选择指定功能只需要配置对应的ID，重新实现指定功能可通过配置其他字段来实现

## 类型定义

```ts
type VueComponent = any
type OverwriteFn = (ctx, originFn) => (...args) => any
type Overwrite = {
  template?: string
  methods?: Record<string, Record<string, OverwriteFn>>
  // 此处的lifeCycle会替换原来的生命周期，而上面的lifeCycle代码会直接插入到应用中
  lifeCycle?: Record<
    string,
    Record<string, OverwriteFn | (OverwriteFn | undefined)[]>
  >
}

interface MetaApp {
  id: string
  // 元应用的入口组件
  entry?: VueComponent
  // 元应用中可供定制的局部模块组件，例如定制 header、footer
  components?: Record<string, VueComponent>
  // 对外提供的api接口
  apis?: Record<string, Function>
  // apis自动注册为useXxx composable形式(不对外)
  composable?: {
    name: string;
  }
  // component的配置项
  options?: Record<string, any>
  // 布局元应用。如果当前元应用需要定制布局，可以抽取一层布局元应用
  layout?: MetaApp
  // 元应用生命周期。此处写的代码会直接插入到应用中
  lifeCycle?: Record<string, Function>
  // 覆盖逻辑
  overwrite?: Overwrite
  // 依赖的其他元应用
  metas?: Array<MetaApp | MetaService>
}

interface MetaService {
  id: string
  type: 'MetaService'
  apis: Record<string, Function | Object>,
  // apis自动注册为useXxx composable形式(不对外)
  composable?: {
    name: string;
  }
}

// 注册表类型
type AppRegistry = Record<string, MetaApp | MetaApp[]>
```

示例:

```js
export default {
  key: {
    id: 'engine.key',
    component: VUE_COMPONENT,
    options: {
      left: '10px',
    },
    overwrite: {
      template: TEMPLATE,
      methods: {
        '': {
          handleClick: (ctx, originFn) => () => {},
        },
      },
      lifeCycle: {
        '': {
          onMounted: [
            , // // 第1个onMounted生命周期函数不覆盖
            (ctx, originFn) => () => {},
          ],
        },
      },
    },
  },
}
```

## 合并机制

合并流程：1. 先根据自定义注册表填写的ID，取出默认注册表对应的功能模块。2. 自定义注册表某个功能模块的配置会覆盖默认注册表中对应的配置

```js
// 默认注册表
{
  key1: {
    id: 'engine.key1',
    component: VUE_COMPONENT_1,
    apis: {
      getDsl: () => {}
    }
  },
  key2: {
    id: 'engine.key2',
    component: VUE_COMPONENT_2
  }
}
// 自定义注册表
{
  key1: {
    id: 'engine.key1',
    component: VUE_COMPONENT_1_A
  }
}
// 合并后的注册表
{
  key1: {
    id: 'engine.key1',
    component: VUE_COMPONENT_1_A,
    apis: {
      getDsl: () => {}
    }
  }
}
```
