# Registry demo

```js
export default {
  type: {
    id: 'engine.type.id',
    component: VUE_COMPONENT,
    // 组件暴露的api接口
    apis: {},
    // 配置项，通过props传递给组件
    options: {},
    // 如果此插件需要定制布局，则抽一层布局元应用
    layout: LAYOUT_COMPONENT,
    // 覆盖逻辑
    overwrite: {
      template: TEMLATE,
      methods: {
        '': {
          handleClick: (ctx) => () => {},
        },
      },
      lifeCycle: {
        '': {
          onMounted: [
            (ctx) => () => {
              console.log('onMounted 1');
            },
            (ctx) => () => {
              console.log('onMounted 2');
            },
          ],
        },
      },
    },
  },
};
```
