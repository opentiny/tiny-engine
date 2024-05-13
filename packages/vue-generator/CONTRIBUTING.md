# 如何参与 TinyEngine 出码能力共建

> 你好，很高兴你有兴趣参与 TinyEngine 出码能力的共建，增强出码能力。在参与贡献之前，请阅读以下的贡献指南。

## 提交 issue

请遵循 [issue 提交指引](https://github.com/opentiny/tiny-engine/blob/develop/CONTRIBUTING.zh-CN.md#%E6%8F%90%E4%BA%A4-issue)

## 提交 Pull Request

请遵循 [PR 提交指引](https://github.com/opentiny/tiny-engine/blob/develop/CONTRIBUTING.zh-CN.md#%E6%8F%90%E4%BA%A4-issue)

## 出码能力共建

1. 基于 develop 分支，创建新分支，如果是提交新 feature，则分支名为 feat/xxx 格式，如果是 bugfix，则分支名为 fix/xxx 格式。
2. 执行 pnpm install 安装依赖。
3. 在终端打开 `vue-generator` 目录，`cd packages/vue-generator`。
4. 在 `vue-generator/src` 目录下新增您的 feature 或者是修复 bug。
5. 在 `vue-generator/test` 目录下增加测试用例。
6. 在 `packages/vue-generator` 目录下， 终端执行 `pnpm run test:unit` 确保所有用例通过。
7. 在 Github 上发起 PR并通知 Opentiny 官方。

## 自测试指引

### 测试使用的 library

我们使用 [vitest](https://vitest.dev/)，所以需要你同时遵守 vitest 相关的约定。
比如：测试文件以  `.test.js`  为后缀

### 执行单个用例文件

假如我们有测试文件 `testCaseName.test.js`，如果我们只想执行该测试文件，则可以：

```bash
pnpm test:unit testCaseName
```

### 使用 vscode debugger 调试能力调试测试用例。

1. 新建 vscode JavaScript Debug Terminal（JavaScript 调试终端）
2. 终端打开 vue-generator 目录，`cd packages/vue-generator`
3. 对需要调试的位置打上断点（VSCode 文件行数旁边）
4. 执行 `pnpm test:unit testCaseName`

### 更多测试指引，可参考 [vitest](https://vitest.dev/) 指引
