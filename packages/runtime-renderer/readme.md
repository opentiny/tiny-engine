# 运行时渲染器-在线应用预览

## 功能目录结构

packages/runtime-renderer
├── config.ts                        配置相关
├── index.ts                         运行时渲染器入口文件
├── package.json                     依赖记录
├── src/                             源代码目录
│   ├── App.vue                      APP.vue入口
│   ├── components/                  通用组件
│   ├── composables/                 应用数据记录相关
│   ├── renderer/
│   │   ├── app-function/            应用通用函数
│   │   ├── builtin/                 染器内部组件（待迁移至builtinComponent包）
│   │   ├── context/                 页面运行时上下文
│   │   ├── data-function/           数据转换通用函数
│   │   ├── material-function/       物料通用函数
│   │   ├── page-function/           页面通用函数
│   │   ├── RenderMain.ts            渲染器入口
│   │   └── render.ts                渲染器组件
│   └── types/                       TS类型定义
├── types.d.ts                       TS类型扩展
└── vite.config.ts                   编译配置

## 渲染器架构图

![渲染器架构图](./renderer-arch.png)

## 启动开发

```bash
pnpm i

pnpm dev
```

## 生产打包

```bash
pnpm i

pnpm build:plugin

pnpm build:prod
```
