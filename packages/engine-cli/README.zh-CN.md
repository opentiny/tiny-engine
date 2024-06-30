# engine-cli

用于创建 tiny-engine 平台或者插件的 cli

## 开发

```sh
npm run dev    # build in watch mode
npm run build  # build engine-cli
npm link       # after link, you can test engine-cli commands use: engine-cli create xxx
```

## 使用

### 根据 prompt 提示进行选择创建

```sh
# 根据提示选择创建类型以及项目名称
npx @opentiny/tiny-engine-cli@latest create
```

### 创建平台

```sh
# 创建一个名为  my-designer 的低代码平台
npx @opentiny/tiny-engine-cli@latest create-platform my-designer
```

### 创建插件

```sh
# 创建名为 my-tiny-engine-plugin 的 tiny-engine 插件
npx @opentiny/tiny-engine-cli@latest create-plugin my-tiny-engine-plugin
```

TODO:

- [ ] 插件开发文档&平台二次开发文档
- [ ] 完善模板工程
- [ ] 提供多种平台模板
- [ ] 提供多种插件类型模板
