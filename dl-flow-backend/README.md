# dl-flow backend

## 目录结构

```
├── README.md
├── docker-compose.yaml // 快速启动 compose示例
├── dockerfile          // docker构建文件
├── global.d.ts
├── libs
│   ├── database        // 数据库模块
│   ├── redis           // 缓存模块
│   └── shared          // 共用文件
├── src
│   ├── app.module.ts   // 主文件
│   ├── auth-guard      // token校验门禁 (可以理解为中间件, 不过nest的分类更加细致)
│   ├── code-generate
│   │   ├── ast
│   │   ├── ast.service.ts                      // ast生成服务
│   │   ├── code-generate.controller.ts         // code-generate路由
│   │   ├── code-generate.gateway.ts            // code-generate的websocket路由, 不过在nest中叫做gateway
│   │   ├── code-generate.module.ts             // code-generate的module
│   │   ├── code-generate.schema.ts             // code-generate的schema
│   │   └── code-generate.service.ts            // code-generate的服务
│   ├── layer                                   // layer获取与存储的http接口 (没什么技术含量全是CRUD)
│   ├── main.ts
│   ├── material                                // 物料的获取 (没什么技术含量全是CRUD)
│   ├── user                                    // 用户的登陆注册
│   └── ws-exception                            // websocket的错误捕获, 主要用于捕获Exception和Runtime Error
├── tsconfig.build.json
├── tsconfig.json
└── webpack.config.js                           // 打包的配置文件, 主要是定义全局变量
```

### global.d.ts

```typescript
declare global {
  namespace NodeJS {
    // 为了让process.env.xxx的时候有类型提示
    interface ProcessEnv {
      DB_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_DB: number;
      REDIS_PASSWORD: string;
      JWT_EXPIRE_IN: string;
      JWT_SIGN_ALGORITHM: JwtSignOptions['algorithm'];
      JWT_PUB_KEY: string;
      JWT_PRI_KEY: string;
      /**
       * @deprecated
       */
      PWD_SALT: string; // used for bcrypt
      PWD_SALT_LEN: string;
    }
  }
  // 开发环境标志
  declare const __DEV__: boolean;
  // 测试环境标志
  declare const __TEST__: boolean;
}
export {};
```


## QA

### 为什么使用的是全局变量而不是环境变量?

`__DEV__`与`__TEST__`主要是用于测试环境与开发环境。如果一段代码只是测试环境需要(例如准备内存数据库)，那么我们可以这么写

```typescript
if (__TEST__){
  // do sth
}
```

之后我们只需要在jest的配置文件里的`global`配置项中中，将`__TEST__`定义为`true`就可以了。（详细参考packages.json L94）
而在打包时侯，`webpack`会将`__DEV__`与`__TEST__`占位符替换为false, 这样一来所有的测试代码与开发调试代码都将会被标记为`dead code`. 最后会被`webpack`自动剔除 (详细参考 webpack.config.js L12-)

### 为什么使用内存数据库而不是MOCK？

mock一组数据是人来mock, 工作量是其次，最主要的问题是难以`靠近实战`. 之所以选择使用内存数据库而不是手动mock, 我给出如下原因

1. 不需要手动mock数据，避免因为人脑无法达到**完全理性**而造成的**数据结构**问题
2. 内存数据库的可维护性很高
3. 数据的销毁简单,不需要本地启动复杂的环境