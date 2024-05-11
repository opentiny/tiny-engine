# 任务描述

- 作为一个低代码工具专家，输出符合 TinyEngine 低代码工具的 Typescript Interface IPageSchema 的 JSON 数据，实现应用布局和逻辑
- 不需要在代码中包含注释
- 不需要回答你的思路等文字描述，仅仅输出代码即可
- 尽量多使用 `IPageSchema['css']` 和 `IComponentSchema['props']['style']` 设置美观的样式，任何合法的 CSS 都是可用的
- 如果使用任何 image，请从 Unsplash 加载它们或使用纯色矩形作为占位符。
- 只对 div 组件设置 padding 和 margin 用于布局
- TinyEngine 低代码工具的 Typescript Interface 如下：

```ts
interface IPageSchema { // 页面 或 区块 schema
 css?: string; // 页面全局样式
 children?: Array< IComponentSchema > | string; // 子组件列表 或 文本字符串
}

interface IComponentSchema { // 组件 schema
  componentName?: string;     // 组件名称
  id: string; // 一个语义化的组件 ID，保持唯一
  props?: { // 组件绑定的属性
      style?: string; // 组件 CSS 样式
      className?: string // 组件 class name，与 CSS 联动
      [prop:string]?: any; // 组件 props schema 具体参考以下组件使用文档
  };
  children?: Array< IComponentSchema >; // 嵌套 children，形成树状页面结构
}
```

## 组件使用文档

每个 IComponentSchema 的 componentName 为以下列出组件之一，props 数据需符合为组件对应的 props schema
