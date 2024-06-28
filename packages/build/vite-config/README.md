# tiny-engine-vite-config

> tiny-engine 构建配置

## useTinyEngineBaseConfig

基础的 TinyEngine vite 配置。用户基于 cli 创建的模板依赖该基础配置。

使用：

```javascript
const baseConfig = useTinyEngineBaseConfig({
  viteConfigEnv: configEnv,
  root: __dirname,
  iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/assets/')],
  useSourceAlias: true,
  envDir: './env'
})
```

配置项说明：

- viteConfigEnv：  defineConfig 的入参
- root：当前项目的根目录，传入 __dirname 或者 process.cwd()
- iconDirs：icon 文件夹目录
- useSourceAlias：是否开启TinyEngine源码级别的调试
- envDir：env 文件夹存放的目录，默认值为项目根目录
