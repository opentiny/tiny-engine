# engine-ai-plugins 设计文档

## 目标

TinyEngine 作为一个低代码引擎，内置了一套更加结构化、精简的 schema 用于描述 UI 应用逻辑。相比原生代码，LLM AI 在理解、生成 schema 时会更加高效、准确，因此 engine-ai-plugins 将通过开发一组 TinyEngine 插件探索 LLM AI 和低代码引擎结合的最佳实践。

目前实现中包含以下两个 AI 插件：

- page creator，根据文字和图片输入的提示词，生成稳定、丰富的 TinyEngine 页面，且产出物为 TinyEngine JSON schema。（在仓库中已有的 robot plugin 实现中，看起来是让 LLM AI 输出标准的 Vue2 代码，再通过 `/app-center/api/ai/chat` API 获取的返回结果中就有了 schema，可能是该 API 中包含 Vue -> schema 的实现，但暂未看到对应代码开源）。
- component editor，通过松散的文字输入与结构化的表单 UI **混合编辑**每个组件的属性，实现效率的最大化，可以看作是对当前组件属性编辑器的一个扩展。

## 设计思路概览

### page creator：基于 prompt engineering 优化 schema 生成结果

在 TinyEngine 中已有不少注册的组件，且其架构支持持续实现、注册新的组件，如果让 LLM AI 知道这些组件的存在、理解这些组件的用法、收到需求时正确组合这些组件完成需求，就是 page creator 的实验方向。

由于 TinyEngine 组件对于 LLM AI 来说不是热知识，所以通常有 prompt engineering 和 fine-tuning 两个方案向 LLM AI 注入知识，在我们过往的经验中，prompt engineering 在这类场景下已经足够好。

TinyEngine 中通过一个 bundle.json 维护了注册的组件和示例代码，经过对比测试，我们发现仅仅将示例代码放入 prompt 中，生成效果就不错，希望进一步提升 LLM AI 表现，可以维护更详细或多个 snippet 示例。

这个[脚本](./scripts/generate-prompt.js)完成了从 bundle.json 拼接 prompt 的工作，目前对质量比较高的组件进行了拼接。

除了组件使用知识之外，prompt 中还包含了 TinyEngine schema 的 Typescript interface，在对比测试中同样发现仅保留必要的结构、样式相关的字段，LLM AI 的注意力可以更加稳定集中在主要任务中，显著提升了 schema 生成的稳定性。

在插件 UX 设计中，由于 page creator 的定位是从零生成一个基础页面，供后续的迭代修改，所以输入部分支持文字描述和图片描述（以来 gpt4-vision 模型）。

page creator 专注页面结构和样式的实现，也代表了一种可行的低代码 AI 插件的设计思路：由于低代码引擎从 schema 到编辑器 GUI 都对视图、状态、逻辑做了清晰的划分，所以也可以开发多个各司其职的 AI 插件，有助于提升完成单项任务的稳定性且成本更可控，而不是追求一个 AI 插件完成所有的页面搭建工作。

### component editor：AI form 混合编辑

虽然同样借助 LLM AI 的能力，但 component editor 的实验方向和 page creator 非常不同。在 component editor 中，我们设计了一种 AI form 架构，可以最大程度结合自然语言松散输入效率高和结构化 UI 精确输入准确性高的有点，降低用户使用低代码引擎的技术门槛。

以 TinyEngine 中的 TinySelect 组件为例，它包含了 searchable、closable、placeholder 等一系列常规属性的配置能力，这些配置通过表单 UI 输入准确性高、操作便捷。但它还包含 options 这样的复杂数据结构，目前 TinyEngine 中预期使用代码编辑器进行配置，对于低代码引擎用户来说还是有一定门槛。即使设计了专用的 JSON 输入 UI，也有较高的学习成本和操作复杂度。这时结合对应属性的数据结构和用户提示词，让用户通过 `增加 10 个水果的选项` 这样的方式进行配置，就带来了很大的效率提升。

另一个使用低代码引擎的场景是静态页面，例如官网或 H5 活动页面，这类网站通常包含大量的文案编写工作，例如宣传语。AI form 同样可以将输入文案的场景和 LLM AI 结合，让 LLM AI 完成它最擅长的 text-gen 工作。

AI form 在技术架构上，是对 LLM AI functional calling 能力的封装：

- 通过对类型的封装，表单 UI 和 LLM AI 共享一套类型逻辑。
- 通过状态机封装，实现对于不同状态数据的呈现和管理。

在这个[文件](./src/plugins/component-editor/edit-component-form.tsx)中可以看到当前几个已经封装为 AI form 的低代码组件的封装方式，基本只需要声明少量类型即可。

状态机逻辑可以参考这个[文件](./src/plugins/ai-form.tsx)中的 Machine 实现。

### 使用非 Vue 技术栈开发插件

由于 AI UI 生态中 React 更为活跃，所以为了验证使用 React 开发 TinyEngine 插件的可行性，当前仓库中的插件均基于 React 开发。遇到的问题是通过 useCanvas 等 Vue hook 获取状态时存在异常，暂未深入调查，代码中通过依赖注入的形式修复。

## Demo 视频

[视频链接](https://www.bilibili.com/video/BV1xH4y1p7ZG/)

## 使用方式

当前仓库未发布至 NPM，可以通过 pnpm i $FOLDER 的方式本地安装测试。在当前仓库中，通过以下方式打包：

```shell
cd packages/plugins/ai
yarn
yarn build:lib
```

在 TinyEngine 中，在 `packages/design-core/config/addons.js` 内加载插件：

```js
import { useCanvas, useHistory } from '@opentiny/tiny-engine-controller'
import { getPlugins } from '@opentiny/tiny-engine-plugin-ai'

const { PageCreator, ComponentEditor } = getPlugins({ useCanvas, useHistory })

const addons = {
  plugins: [PageCreator, ComponentEditor]
}
```

使用时，输入 OpenAI API key，按需配置代理。
