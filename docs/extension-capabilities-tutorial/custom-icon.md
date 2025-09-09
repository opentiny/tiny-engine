### 自定义图标与内置图标使用指南

本文介绍 TinyEngine 中 SVG 图标的两种来源：
- 内置图标（已预编译，开箱即用）
- 自定义图标（由业务项目提供）

并给出在项目中启用、使用与排错的完整指引。

---

## 内置图标（预编译）

- 内置图标已经在引擎侧预编译并按需注入，无需在业务项目里额外配置。
- 直接在任意 Vue 模板中使用全局组件 `SvgIcon`（模板里写作 `<svg-icon>`）：

```vue
<template>
  <div>
    <!-- 假设存在名为 setting 的内置图标 -->
    <svg-icon name="setting" />
  </div>
  
</template>
```

提示：内置图标统一以 `<svg-icon name="图标名称" />` 的方式使用，`name` 为该图标的文件名（去掉 .svg 后缀）。

---

## 自定义图标

自定义图标适用于需要在项目内新增/覆盖业务图标的场景。

### 1) 准备 SVG 文件

- 将你的 SVG 文件放到业务项目的本地目录（建议 `./assets/`）。
  - 例如：`designer-demo/assets/test-icon.svg`
  - 文件需为标准的单个 `<svg>...</svg>` 根节点。

### 2) 在 Vite 配置中启用目录

如果你使用的是引擎提供的基础配置（推荐）：

```js
// designer-demo/vite.config.js
import path from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { useTinyEngineBaseConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((configEnv) => {
  const baseConfig = useTinyEngineBaseConfig({
    viteConfigEnv: configEnv,
    root: __dirname,
    // 仅在需要“自定义图标”时，指向项目本地目录
    iconDirs: [path.resolve(__dirname, './assets/')],
    useSourceAlias: true,
    envDir: './env',
    registryPath: './registry.js'
  })

  return mergeConfig(baseConfig, {
    envDir: './env',
    publicDir: path.resolve(__dirname, './public'),
    server: { port: 8090 }
  })
})
```

注意：不要把 `iconDirs` 配置为指向 `node_modules/@opentiny/tiny-engine/assets/` 的路径。内置图标已预编译，指向该路径是废弃做法，仅在需要项目“自定义图标”时配置本地目录即可。

### 3) 在入口注册图标（确保一次）

在你的应用入口文件里引入一次 `virtual:svg-icons-register`，确保图标精灵成功注入：

```js
// designer-demo/src/main.js（或 src/preview.js）
import 'virtual:svg-icons-register'
```

如果你是基于引擎的示例或推荐模板启动，通常已包含此导入；如未包含，请手动添加一次即可。

### 4) 使用自定义图标

`name` 为 SVG 文件名（不含后缀）：

```vue
<template>
  <svg-icon name="accessdeclined" />
</template>
```

你也可以在脚本中以编程方式渲染：

```js
import { h, resolveComponent } from 'vue'

const iconVNode = h(resolveComponent('svg-icon'), { name: 'accessdeclined', style: { fontSize: '24px' } })
```

---

## 命名与加载规则

- 生成的符号 id 形如：`icon-[name]`，其中 `[name]` 即你的 SVG 文件名。
- 传给 `<svg-icon>` 的 `name` 必须与 SVG 文件名一致（不含 `.svg`）。
- 建议避免使用与内置图标同名的 `name` 以免造成歧义。

---

## 样式与尺寸

- 组件类名：`.svg-icon`
- 默认样式（节选）：

```css
.svg-icon {
  width: 1em;
  height: 1em;
  /* 继承文字颜色，可通过 color 控制填充色 */
  fill: currentColor;
}
```

- 调整大小：

```vue
<svg-icon name="setting" style="font-size: 20px; color: #1f66ff" />
```

---

## 多目录支持

你可以在 `iconDirs` 中提供多个本地目录：

```js
iconDirs: [
  path.resolve(__dirname, './assets/'),
  path.resolve(__dirname, './more-icons/')
]
```

---

## 常见问题（FAQ）

- 看不到图标或渲染为空：
  - 确认入口已引入一次 `virtual:svg-icons-register`。
  - 确认 SVG 文件合法（单个 `<svg>` 根节点）。
  - 确认 `iconDirs` 指向的是项目本地目录，而不是已废弃的 `node_modules/@opentiny/tiny-engine/assets/`。
  - 修改/新增图标后，若未生效，可重启 Vite 开发服务器。

- 如何区分内置图标与自定义图标？
  - 内置图标由引擎预编译并注入，使用时无需配置目录。
  - 自定义图标由你的项目提供，需要在 `vite.config.js` 里配置 `iconDirs` 指向本地目录。

- 会不会互相覆盖？
  - 建议避免使用与内置图标同名的 `name` 以免造成歧义。

---

## 重要提醒（从 2.9+ 起）

当检测到以下配置时会给出告警：

> 发现 `iconDirs` 指向 `"@opentiny/tiny-engine/assets"`。内置 SVG 图标已预编译，无需在项目里配置该路径。仅当需要“自定义图标”时，请改为使用项目本地目录，例如：
>
> - 替换为：`iconDirs: [path.resolve(__dirname, './assets/')]`
> - 并将自定义 SVG 图标放入项目的 `assets` 目录。

请按照上述指引迁移，避免无效打包或重复注入。
