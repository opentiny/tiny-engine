# @opentiny/tiny-engine-dsl-vue

> 将 schema 转换成具体的，可读性高，可维护的代码


TODO:

- [ ] 架构支持配置出码
- [ ] 抽取通用底层能力，支持用户自定义插件，自定义出码结果
- [ ] 官方提供更多内置出码方案

## 安装

```bash
npm install @opentiny/tiny-engine-dsl-vue
```

## 使用

### 使用官方默认配置出码

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const instance = generateApp()

const res = await instance.generate(appSchema)
```

### 传入配置

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const instance = generateApp({
  pluginConfig: {
    formatCode: {
      singleQuote: false,
      printWidth: 180,
      semi: true 
    } 
  }
})

const res = await instance.generate(appSchema)
```

### 使用自定义插件替换官方插件

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const customDataSourcePlugin = () => {
  return {
    name: '',
    description: '',
    run: () {
      // ... 自定义出码逻辑
    }
  }
}

const instance = generateApp({
  customPlugins: {
    dataSource: customDataSourcePlugin()
  }
})

const res = await instance.generate(appSchema)
```

