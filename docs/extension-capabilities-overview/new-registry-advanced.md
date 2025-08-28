# 注册表高级配置


## 注册表 hotfix 功能，实现紧急 bug 修复功能

> 注：该功能可用版本：2.7.0+
>
> ⚠️ 该功能应该仅作为紧急 bug 修复使用，不应该滥用，一旦官方已经修复 bug，请及时移除 hotfix 注册表。

背景：开源的开发过程中，难免会遇到一些紧急的 bug 需要修复，如果等待开源版本的下个版本发布，可能需要经过这样一个流程：

1. 用户向TinyEngine团队反馈 bug。（30min - 1h）
2. TinyEngine团队分析 bug 原因，并给出修复方案。（1h - 2h）
3. 验证修复方案，发布新版本。（1h）
4. 用户同步新版本，验证新版本。（1h-2h）
5. 用户确认无误，提交审批流程给领导，发布新版本。（1h-2h）
6. 新版本上线，用户可以正常使用。（1h-2h）

经过上述的一个流程可以看到，整个标准的修复流程相对比较长，如果是一些对用户影响比较大的问题，在商业上可能无法满足要求。

因此，我们推出了注册表的 hotfix 功能，可以通过传入 hotfix 的注册表，对某些插件实现函数级别的覆盖能力，从而实现快速修复紧急 bug。

### hotfix 注册表功能使用示例：

1. 在后端增加一个接口，返回临时的 hotfix 注册表。比如 `/hotfix-registry.js`。没有紧急 bug 的时候，返回空对象。

2. 在 TinyEngine 初始化的时候，调用这个接口，获取临时的 hotfix 注册表。

```javascript
// 这里获取线上的注册表
const fetchHotfixRegistry = async (url) => {
  const response = await import(/* @vite-ignore */ url)
  return response.default
}

async function startApp() {
  // 调用 initHotfixRegistry 方法，传入接口地址以及请求方法，获取临时的 hotfix 注册表并提前注册。
  const hotfixRegistry =
    (await initHotfixRegistry({
      url: 'http://localhost:8090/hotfixRegistry.js',
      request: fetchHotfixRegistry
    })) || {}

  const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // 合并多个注册表
    registry: [registry.default, hotfixRegistry],
    configurators,
    createAppSignal: ['global_service_init_finish']
  })
}

startApp()
```

示例 hotfix 注册表：

```javascript
// hotfixRegistry.js
export default {
  'engine.plugins.i18n': {
    overwrite: {
      methods: {
        'Main': {
          // 覆盖 i18n 插件的 openEditor 方法
          openEditor: (ctx) => (_event, row) => {
            const { isEditMode, editingRow, i18nTable, langList, getActiveRow, utils } = ctx()
            isEditMode.value = Boolean(row.key)
            editingRow.value = row
            if (!isEditMode.value) {
              row.key = `custom.${utils.guid()}`
              langList.value.unshift(row)
            }
            i18nTable.value.setActiveRow(row).then(() => {
              getActiveRow()
            })
          }
        }
      },
      lifeCycles: {
        'Main': {
          onMounted: [
            // i18n 插件 Main.vue 文件的第一个 onMounted 方法，不覆盖
            '',
            // 覆盖 i18n 插件 Main.vue 文件的第二个 onMounted 方法
            (ctx) => () => {
              const { i18nSearchTypes, currentSearchType } = ctx()
              console.log('overWrite i18n onMounted', i18nSearchTypes, currentSearchType.value)
              currentSearchType.value = i18nSearchTypes[0].value
            }
          ]
        }
      }
    }
  }
}
```

### 注册表 hotfix 功能说明

#### 注册表的 hotfix 功能，需要提前注册，因为 overWrite 的逻辑需要提前读取。

即 initHotfixRegistry 方法的调用，必须在 registry 以及 init 方法之前。（所以 注册表 以及 init 方法都需要改成异步的 import）

```javascript
async function startApp() {
  
  const hotfixRegistry =
    (await initHotfixRegistry({
      url: 'http://localhost:8090/hotfixRegistry.js',
      request: fetchHotfixRegistry
    })) || {}

  const registry = await import('../registry')
  const { init } = await import('@opentiny/tiny-engine')

  init({
    // 合并多个注册表
    registry: [registry.default, hotfixRegistry],
    configurators,
    createAppSignal: ['global_service_init_finish']
  })
}
```

#### hotfix 注册表的覆盖能力

1. 覆盖插件的 methods 方法（自定义方法）
2. 覆盖插件的 lifeCycles 方法（vue 生命周期）

### hotfix 注册表覆盖示例

#### 覆盖插件的 methods 方法

假如我们希望覆盖 i18n 插件中 Main.vue 文件的 openEditor 方法：

1. 查看 i18n 插件的 src/Main.vue 文件，发现有 metaService 的注释，确认可以对该文件进行覆盖。（没有 metaService 或者是 metaComponent 注释的文件，无法进行覆盖）

metaService 或者是 metaComponent 注释的格式如下：

```javascript
/* metaService: engine.plugins.i18n.Main */

/* metaComponent: engine.plugins.i18n.Main */
```

2. 查看 Main.vue 文件的 metaService 注释，确认 id 为 engine.plugins.i18n.Main。我们将这个 id 拆分成两个部分：

a. 插件 id：engine.plugins.i18n
b. 文件 id：Main

3. 根据插件 id 和文件id，我们就可以确定配置的相关 key。于是：我们就可以得到如下代码：

```javascript
export default {
  'engine.plugins.i18n': {
    overwrite: {
      methods: {
        'Main': {
          openEditor: (ctx) => (_event, row) => {
            const { isEditMode, editingRow, i18nTable, langList, getActiveRow, utils } = ctx()
            isEditMode.value = Boolean(row.key)
            editingRow.value = row
            if (!isEditMode.value) {
              row.key = `custom.${utils.guid()}`
              langList.value.unshift(row)
            }
            i18nTable.value.setActiveRow(row).then(() => {
              getActiveRow()
            })
          }
        }
      }
    }
  }
}
```

代码解析：
- 'engine.plugins.i18n'，指定我们要配置 i18n 插件。
- overwrite 指定我们要使用覆盖功能。
- methods 指定我们要覆盖 i18n 插件的 methods 方法。
- 'Main'，指定我们要覆盖 i18n 插件的 Main.vue 文件。
- openEditor 指定我们要覆盖 i18n 插件的 openEditor 方法。

方法覆盖说明：
- 方法覆盖的格式为：`方法名: (ctx) => (_event, row) => { ... }`。
- ctx 为上下文对象方法，通过 ctx() 获取，可以得到原来的上下文对象。
- _event, row 为原来方法形参（入参），不可以覆盖。
- `{...}` 为新方法的实现，在这里实现函数覆盖的逻辑。

##### 覆盖插件的 lifeCycles 方法

假如我们希望覆盖 i18n 插件的 onMounted 方法：

1. 查看 i18n 插件的 src/Main.vue 文件，发现有 metaService 的注释，确认可以对该文件进行覆盖。（没有 metaService 或者是 metaComponent 注释的文件，无法进行覆盖）

2. 查看 Main.vue 文件的 metaService 注释，确认 id 为 engine.plugins.i18n.Main。我们将这个 id 拆分成两个部分：

a. 插件 id：engine.plugins.i18n
b. 文件 id：Main

3. 根据插件 id 和文件id，我们就可以确定配置的相关 key。于是：我们就可以得到如下代码：

```javascript
export default {
  'engine.plugins.i18n': {
    overwrite: {
      lifeCycles: {
        'Main': {
          onMounted: [
            (ctx) => () => {
              const { i18nSearchTypes, currentSearchType } = ctx()
              console.log('overWrite i18n onMounted', i18nSearchTypes, currentSearchType.value)
              currentSearchType.value = i18nSearchTypes[0].value
            }
          ]
        }
      }
    }
  }
}
```

代码解析：

- 'engine.plugins.i18n'，指定我们要配置 i18n 插件。
- overwrite 指定我们要使用覆盖功能。
- lifeCycles 指定我们要覆盖 i18n 插件的 lifeCycles 方法 (vue 生命周期)。
- 'Main'，指定我们要覆盖 i18n 插件的 Main.vue 文件。
- onMounted 指定我们要覆盖 i18n 插件的 onMounted 方法，由于 onMounted 方法可能会声明多次，所以我们这里需要使用数组，需要覆盖第几次 onMounted 方法，就在数组对应的排列顺序上写覆盖方法，如果前面的不需要覆盖，则写空字符串。

比如：

```javascript
onMounted: [
  '',
  '',
  '',
  // 这里覆盖第4次 onMounted 方法
  'onMounted: (ctx) => () => { ... }'
]
```

现在，让我们再来看看使用了 hotfix 注册表之后的修复流程：

1. 二开用户向TinyEngine团队反馈 bug。（30min - 1h）
2. TinyEngine 分析 bug 原因，并给出修复方案。（1h - 2h）
3. 二开用户使用 hotfix 注册表功能，覆盖官方的某个函数或者是模板。（10min）
4. 用户验证修复方案，推送到生产环境注册表。（1h）
5. 生产环境生效，用户正常使用。

可以看到，使用 hotfix 注册表之后，修复流程大大缩短，大大提高了修复效率。
