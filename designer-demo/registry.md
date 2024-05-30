# 注册表

类型定义

```ts
type VueComponent = any
type OverwriteFn = (ctx, originFn) => (...args) => any

interface MetaApp {
  id: string
  component: VueComponent
  // 组件暴露的api接口
  apis?: Record<string, Function>
  // component的配置项
  options?: Record<string, any>
  // 布局元应用。如果当前元应用需要定制布局，可以抽取一层布局元应用
  layout?: MetaApp
  // 元应用生命周期
  lifeCycle?: Record<string, Function>
  overwrite?: {
    template?: string
    methods?: Record<string, Record<string, OverwriteFn>>
    lifeCycle?: Record<
      string,
      Record<string, OverwriteFn | (OverwriteFn | undefined)[]>
    >
  }
  // 依赖的其他元应用
  metas?: MetaApp[]
}

// 注册表类型
type AppRegistry = Record<string, MetaApp | MetaApp[]>
```

示例:

```js
export default {
  type: {
    id: 'engine.type.id',
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
