# #PROJECT_NAME#

## 开发

### 安装所需的依赖

```sh
npm install
```

### 本地开发，启动本地 mock 服务器，使用本地 mock 服务器的 mock 数据

```sh
npm dev
```

## 构建

```sh
# 构建设计器
npm run build

```

## engine-cli

### 新增插件

```sh
cd #PROJECT_NAME#
# 新增一个插件，名称为 custom-plugin，类型为 plugins，对其位置为 top
engine-cli create-plugin custom-plugin -t plugins -a top
```

### 注册插件

在 `registry.js` 中新增如下代码

```diff
// 导入新增的插件
+ import CustomPlugin from "./custom-plugin";

// 将新增的插件添加到 plugins 数组。如果插件类型为 toolbars，则添加到 toolbars 数组
export default {
  root: {
    /* ... */
  },
  config: engineConfig,
  layout: Layout,
  themes: [
    /* ... */
  ],
  toolbars: [
    /* ... */
  ],
  plugins: [
    /* 其他插件... */
+   CustomPlugin,
  ],
  dsls: [{ id: "engine.dsls.dslvue" }],
  settings: [Props, Styles, Events],
  canvas: Canvas,
};
```

### 新增设置器

```sh
cd #PROJECT_NAME#
# 新增一个设置器，名称为 CustomConfigurator
engine-cli create-configurator CustomConfigurator
```

### 注册设置器

在 `src/configurators/index.js` 中新增如下代码

```diff
// 导入新增的设置器
+ import CustomConfigurator from "./CustomConfigurator.vue";

// 将新增的设置器添加到 configurators 对象
export const configurators = {
  /* 其他设置器... */
+ CustomConfigurator,
};
```
