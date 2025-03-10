# 官方出码能力API

## generateApp

该函数返回出码实例

使用示例：

```javascript
import { generateApp } from '@opentiny/tiny-engine-dsl-vue'

const instance = generateApp(config)
```

类型定义：

```typescript
function generateApp(config?: IConfig): CodeGenInstance
```

## CodeGenerator

出码工厂类，负责调用插件执行出码。用户可调用  `generate` 方法执行出码。

使用示例：

```javascript
const instance = generateApp(config)
// 传入当前应用 schema
const res = await instance.generate(appSchema)
```

类型定义：

```typescript
interface codeGenInstance {
  generate(IAppSchema): ICodeGenResult
}
```

## 自定义出码插件相关 API

自定义简单示例：

```javascript
function customPlugin() {
  return {
    // 插件名
    name: 'tiny-engine-generate-code-plugin-demo',
    // 插件相关描述
    description: 'demo',
    // run 函数，出码流程会调用
    run(schema, context) {
      // 在函数内实现自定义出码
      console.log('here is a demo plugin')
    }
  }
}
```

类型定义：

```typescript
function run(schema: IAppSchema, context: IContext): Promise<void>
```

### run函数插件可以访问的上下文

#### addLog

向返回结果增加一条日志

使用示例：

```javascript
function customPlugin() {
  return {
    name: 'tiny-engine-generate-code-plugin-demo',
    description: 'demo',
    run(schema, context) {
      this.addLog('plugin-demo is running')
    }
  }
}
```

类型定义：

```typescript
function addLog(log: any): void;
```

#### addFile

向 genResult 结果数组中增加一个文件

使用示例

```javascript
function customPlugin() {
  return {
    name: 'tiny-engine-generate-code-plugin-demo',
    description: 'demo',
    run(schema, context) {
      this.addFile({
          path: './src/test.js',
          fileContent: 'function foo() { console.log("hello world") }',
          fileType: 'js',
          fileName: 'test.js'
        },
        true
      )
    }
  }
}
```

类型定义：

```typescript
/**
 * fileItem 需要增加的文件
 * overwrite 如果存在相同路径的文件，是否覆盖
 * @return {boolean} 是否增加成功，true 代表增加成功，false 代表增加失败
 */
function addFile(fileItem: IFile, overwrite: boolean): boolean;
```

#### getFile

根据提供的文件路径(path)和文件名(fileName) 在 genResult 中寻找指定文件。

使用示例:

```javascript
function customPlugin() {
  return {
    name: 'tiny-engine-generate-code-plugin-demo',
    description: 'demo',
    run(schema, context) {
      const file = this.getFile('./src/test.js', 'test.js')
    }
  }
}
```

类型定义：

```typescript
/**
 * @param {String} path 文件路径
 * @param {String} fileName 文件名
 * @return {IFile | undefined} 返回得到的文件，如果没找到，则为 undefined 
 */
function getFile(path: string, fileName: string): IFile | undefined
```

#### replaceFile

在 genResult 文件数组中替换文件，如果不存在，则替换失败

使用示例：

```javascript
function customPlugin() {
  return {
    name: 'tiny-engine-generate-code-plugin-demo',
    description: 'demo',
    run(schema, context) {
      // 如果 genResult 数组中存在 path 和 fileName 相等的项，则替换成功，返回 true，否则，替换失败，返回 false
      this.replaceFile({
          path: './src/test.js',
          fileContent: 'function foo() { console.log("hello world") }',
          fileType: 'js',
          fileName: 'test.js'
        }
      )
    }
  }
}
```

类型定义：

```typescript
function replaceFile(file:IFile): boolean
```

#### deleteFile

从 genResult 中删除指定文件

使用示例：

```javascript
function customPlugin() {
  return {
    name: 'tiny-engine-generate-code-plugin-demo',
    description: 'demo',
    run(schema, context) {
      // 如果 genResult 数组中存在 path 和 fileName 相等的项
      // 则删除成功，返回 true
      // 否则，返回 false
      this.deleteFile({
          path: './src/test.js',
          fileName: 'test.js'
        }
      )
    }
  }
}
```

类型定义：

```typescript
function deleteFile(file: IFile): boolean
```

## 详细类型声明

详细类型声明，可以前往 [GitHub](https://github.com/opentiny/tiny-engine/blob/develop/packages/vue-generator/src/index.d.ts) 查看
