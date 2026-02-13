# TinyEngine 登录功能介绍

## 概述

本文档介绍 TinyEngine 低代码平台新增的用户登录认证与权限控制系统。该系统提供了完整的用户注册、登录、密码找回功能，并实现了基于 Token 的 API 请求认证机制。

## 一、功能特性

1. 相关配置</br>

- 开发环境（MODE=dev）：
  1. 启动项目通过 **pnpm dev:withAuth** 命令开启登录，**pnpm dev** 命令默认不开启。
  2. 在 packages/design-core/registry.js 配置
     ```js
     const isDevelopEnv = import.meta.env.MODE?.includes('dev')
     const useAuth = import.meta.env.VITE_AUTH === 'true'
     // 通过设置enableLogin为true启动登录
     enableLogin: useAuth || !isDevelopEnv
     ```
- 生产环境：默认开启登录认证。

2. 请求拦截机制</br>
   若登录配置为 true，会使用属于登录功能的请求/响应拦截器。

- 请求拦截与状态管理：</br>
  a. 全局未授权标记：通过 isUnauthorized 变量标记是否已发现未授权状态。</br>
  b. 请求计数：使用 requestCount 记录当前请求数量。</br>
  c. 请求取消机制：使用 AbortController 管理进行中的请求，支持批量取消。

- 白名单机制：包含登录、注册、忘记密码、用户信息等接口的 whiteList 放行。

3. Token 处理：从 localStorage 读取 engineToken 对非白名单接口自动添加 Authorization 请求头。

4. 并发请求管理
   ```javascript
   // 使用 Map 存储所有请求的 AbortController
   const abortControllers = new Map()
   // 支持取消所有进行中的请求
   const abortAllRequests = (message = '用户未登录，请求已取消')
   ```
5. 认证错误处理</br>

- 错误码识别：监控特定的登录错误码（CM004、CM005 等）</br>
- 自动跳转登录：发现认证错误时自动触发登录流程</br>
- 请求取消：未授权状态下自动取消后续请求

6. 多租户支持</br>

- 用户可以属于多个组织
- 组织间进行了数据隔离
- URL 参数标识当前应用，当 URL 没有应用 id，会跳转到应用中心

## 二、界面操作

1. 注册账号 - 输入账号、密码、确认密码 - 注册成功获取【账号恢复代码】</br>
   忘记密码 - 输入账号、账号恢复代码、新密码、确认密码 - 新密码设置成功</br>
   登录 - 输入账号、密码 - 登录成功进入设计器</br>
   ![登录](./imgs/auth1.gif)
2. 登录成功后进入设计器，右上角新增用户配置插件，展示用户默认头像、用户名，可以新建组织和切换组织，退出登录的出口也在这里；切换组织后，会默认进入应用中心去选择应用。</br>
   ![用户配置](./imgs/auth2.gif)
3. 应用中心可以创建属于该组织下的应用，点击【开发应用】，进入该应用进行开发。</br>
   ![应用中心](./imgs/auth3.gif)
