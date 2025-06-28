# $$TinyEngine{projectName}END$

$$TinyEngine{description}END$

## 项目介绍

这是一个基于 UniApp + Vue3 + TypeScript + Vite 的跨平台应用项目，支持编译到H5、各种小程序（微信/支付宝/百度/头条/QQ/快手/飞书）、App（iOS/Android）等多个平台。

## 技术栈

- 框架：UniApp + Vue3
- 开发语言：TypeScript
- 构建工具：Vite
- 状态管理：Pinia
- UI组件：uni-ui
- 国际化：vue-i18n
- 代码规范：ESLint + Prettier
- 低代码支持：TinyEngine

## 开发环境要求

- Node.js >= 14.18.0
- npm >= 6.14.0
- Vue.js DevTools
- HBuilderX（推荐）

## 快速开始

1. 安装依赖

```bash
npm install
# 或
yarn install
```

2. 启动开发服务器

```bash
# H5
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin

# App
npm run dev:app

# 其他平台请查看 package.json 中的 scripts
```

3. 打包构建

```bash
# H5
npm run build:h5

# 微信小程序
npm run build:mp-weixin

# App
npm run build:app

# 其他平台请查看 package.json 中的 scripts
```

## 项目结构

```
├── src
│   ├── App.vue                # 应用入口组件
│   ├── main.js                # 应用入口文件
│   ├── manifest.json          # 应用配置文件
│   ├── pages.json            # 页面路由配置
│   ├── uni.scss              # 全局样式变量
│   ├── pages                 # 页面文件夹
│   ├── static                # 静态资源
│   ├── store                 # 状态管理
│   ├── components            # 公共组件
│   └── lowcodeConfig         # 低代码配置
│       ├── bridge.js         # 低代码桥接
│       ├── dataSource.js     # 数据源管理
│       └── lowcode.js        # 低代码入口
├── .env.development          # 开发环境配置
├── .env.production           # 生产环境配置
├── .eslintrc.js             # ESLint 配置
├── .prettierrc              # Prettier 配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.js           # Vite 配置
└── package.json             # 项目配置
```

## 开发指南

### 页面开发

1. 在 `src/pages` 目录下创建页面文件
2. 在 `pages.json` 中配置页面路由
3. 遵循 Vue3 组合式 API 的开发方式

### 组件开发

1. 在 `src/components` 目录下创建组件
2. 使用 TypeScript 编写组件逻辑
3. 使用 SCSS 编写组件样式

### 状态管理

1. 在 `src/store` 目录下创建 Pinia store
2. 使用 `defineStore` 定义 store
3. 在组件中使用 `useStore` 访问状态

### 低代码开发

1. 在 `src/lowcodeConfig` 目录下配置低代码相关功能
2. 使用 `bridge.js` 进行低代码平台交互
3. 使用 `dataSource.js` 管理数据源
4. 在 `lowcode.js` 中统一配置低代码功能

## 注意事项

1. 确保遵循 ESLint 和 Prettier 的代码规范
2. 注意跨平台兼容性问题
3. 合理使用条件编译处理平台差异
4. 及时更新依赖包版本
5. 做好代码测试和性能优化

## 相关文档

- [UniApp 官方文档](https://uniapp.dcloud.io/)
- [Vue3 官方文档](https://v3.cn.vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [uni-ui 文档](https://uniapp.dcloud.io/component/uniui/uni-ui.html)

## License

[MIT](LICENSE)