# @opentiny/tiny-engine-blockToWebComponentTemplate

将区块转换成 webComponent，使得不同技术栈的区块可以统一在 vue 的画布上面运行

## 使用

- 后端拉取 template 
- 将区块 schema 转换成 高代码，并写入 src 文件夹中
- 写入 lib.js，替换 BlockFileName 为实际出码的文件名
- 执行 `pnpm install` 安装依赖
- 运行 `pnpm run build:block` 命令
- 得到 webcomponent 转换产物