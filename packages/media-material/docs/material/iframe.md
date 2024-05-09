## MIframe 嵌入网页

## 基本使用
通过src设置网页地址

<ExampleDoc>
<IframeDemo />
<template #code>

<<< @/examples/iframeDemo.vue

</template>
</ExampleDoc>

## Props

| 属性             | 说明                                                                           | 类型              | 默认值                |
| ---------------- | ------------------------------------------------------------------------------ | ----------------- | --------------------- |
| src             | 网页地址                   | `String`         | -                     |
| width         | 宽度                                                                     | `String`         | `-`               |
| height             | 高度                                                                       | `String`         | `-`               |
| name            | 网页名，用于定位嵌入的浏览上下文的名称称                                                                           | `String`         | `-`               |
| referrerpolicy      | 表示在获取 iframe 资源时如何发送 referrer 首部  | `String`         |                      |

### referrerpolicy 可选值
- no-referrer: 不发送
- no-referrer-when-downgrade: 仅在从 HTTPS 到 HTTP 时发送
- origin: 只发送域名
- origin-when-cross-origin: 跨域时只发送域名
- same-origin: 同源时发送完整的 referrer
- strict-origin: 同源并且同协议时发送完整的 referrer
- strict-origin-when-cross-origin: 跨域并且是HTTPS时发送完整的 referrer
- unsafe-url: 总是发送

## Events
MIframe 组件继承了所有原生的 iframe 标签的事件