# TinyEngine 官方物料

## 使用

### 持续构建

```bash
npm run serve
```

解释：
1. 会持续监听 src 目录下文件变动，持续构建出来物料产物
2. 会启动静态服务器。

### 将组件库分别进行构建，以及将所有组件库构建成一份物料产物

```bash
npm run build

# 构建成功会得到比如 ElementPlus.json、TinyVue.json 等组件库对应的 json，以及 all.json
```

### 将组件库分别进行构建

```bash
npm run build:split

# 构建成功会得到比如 ElementPlus.json、TinyVue.json 等组件库对应的 json
```

## 添加自己的物料

请先大致了解 TinyEngine 物料协议：https://opentiny.design/tiny-engine#/protocol

src 目录功能约定结构：

```bash
src/
|__ ElementPlus 组件库名称
   |__ Button.json ElementPlus Button组件
   |__ Table.json  ElementPlus Table 组件
```

所以，我们添加自己的物料可以大致分为两步：

1. 根据目录结构约定添加  xxx.json 组件文件
2. xxx.json 中根据物料协议进行书写。

## TODO

- [ ] 脚本自动生成组件库对应物料。
