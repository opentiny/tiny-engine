<p align="center">
  <a href="https://opentiny.design/tiny-engine" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny Logo" src="logo.svg" height="100" style="max-width:100%;">
  </a>
</p>

<p align="center">TinyEngine低代码引擎使能开发者定制低代码平台，支持在线实时构建低码平台，支持二次开发或集成低码平台能力</p>

[English](README.md) | 简体中文

🌈 特性：

- 跨端跨框架前端组件
- 支持在线实时构建、支持二次开发或被集成
- 直接生成可部署的源码，运行时无需引擎支撑
- 允许接入第三方组件、允许定制扩展插件
- 支持高代码与低代码，混合开发部署应用
- 平台接入 AI 大模型能力，辅助开发者构建应用

## 文档

- 介绍：https://opentiny.design/tiny-engine#/home
- 使用文档：https://opentiny.design/tiny-engine#/help-center/index
- 演示应用：https://opentiny.design/tiny-engine#/tiny-engine-editor

## 使用

### 环境准备

- 安装 Node.js 18+

- 安装 pnpm 9+

```sh
$ npm install -g pnpm
```

### 使用 cli 创建低代码平台

```sh
# 创建低代码平台
$ npx @opentiny/tiny-engine-cli@latest create-platform <name>
# 进入低代码平台
$ cd <name>
# 安装依赖
$ pnpm install
```

### 本地开发，启动本地 mock 服务器，使用本地 mock 服务器的 mock 数据

> 创建低代码平台后自带的 mock Server 仅包含简单的后端 mock 功能，如果需要体验完整的后端服务能力，请参考下文启动 java 服务端。

```sh
$ pnpm dev
```

### 本地开发，启动 Java 服务端

java 服务端代码仓库：https://github.com/opentiny/tiny-engine-backend-java

启动 Java 服务端进行前后端联调：

[前后端联调文档](https://opentiny.design/tiny-engine#/help-center/course/dev/debugging-of-java-backend)

### 物料同步[方案](https://opentiny.design/tiny-engine#/help-center/course/dev/material-sync-solution)

```sh
$ pnpm splitMaterials
```

```sh
$ pnpm buildMaterials
```

浏览器打开：`http://localhost:8080/?type=app&id=1&tenant=1&pageid=1`  
`url search`参数：

- `type=app` 应用类型
- `id=xxx` 应用 ID
- `tenant=xxx` 组织 ID
- `pageid=xxx` 页面 ID

## 构建

```sh
# 构建设计器
pnpm run build:alpha  或 build:prod
```

## 里程碑

```mermaid
gantt 
dateFormat YYYY-MM-DD
axisFormat %Y-%m-%d

1.0.0-beta.x version : 2023-09-25, 2024-05-20
1.0.0-rc version(refactor version) : 2024-10-01
1.0.0 version : 2024-11-01
2.0.0 version : 2024-12-16
2.1.0 version : 2025-01-02
2.2.0 version : 2025-02-19
2.3.0 version : 2025-03-14
2.4.0 version : 2025-04-07
2.5.0 version : 2025-05-15
```

## 🤝 参与贡献

如果你对我们的开源项目感兴趣，欢迎加入我们！🎉

参与贡献之前请先阅读[贡献指南](CONTRIBUTING.zh-CN.md)。

- 添加官方小助手微信 opentiny-official，加入技术交流群
- 加入邮件列表 opentiny@googlegroups.com

## ❤️ 致谢

感谢所有为 TinyEngine 做出贡献的开发者们！

<p align="center">
  <a href="https://github.com/opentiny/tiny-engine/graphs/contributors" target="_blank">
    <img alt="贡献者" src="https://contrib.rocks/image?repo=opentiny/tiny-engine">
  </a>
</p>

## 开源协议

[MIT](LICENSE)