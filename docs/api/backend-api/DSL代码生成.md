# DSL代码生成

## generateCode

<a id=generateCode> </a>

### 基本信息

**Path：** /generateCode

**Method：** GET

**接口描述：**

<p>作为npm包使用generateCode方法生成代码示例:</p>
<pre><code data-language="js" class="lang-js">const path = require('path')
const fs = require('fs')
const { generateCode } = require('@opentiny/tiny-engine-dsl-ng-tiny/lib/generate-code.js')



const result = generateCode({ pageInfo, blocksData })
result.forEach((item) =&gt; fs.writeFileSync(`dist/${item.filePath}/${item.panelName}`, item.panelValue))
</code></pre>

<p>输入示例: { pageInfo, blocksData };</p>
<pre><code data-language="js" class="lang-js">// pageInfo为页面的schema信息， 
// pageInfo: { schema, name });
{
  name: 'page1',
  schema: {
     // 页面schema
  }
}


// blocksData为页面引用的区块的schema数据
// blocksData: Array&lt;{ label, content }&gt;
[
  {
    label: 'image-title',
    content: {
      // 区块的schema
    }
  },
  {
    // 其他区块...
  }
]
</code></pre>

<p>输出示例：</p>
<pre><code data-language="js" class="lang-js">[
  {
    "panelName": "page1.component.html",  // 文件名
    "panelValue": "xxx",    // 生成代码的内容
    "panelType": "html",     // 生成代码的文件类型：html、css、ts
    "prettierOpt": { "parser": "html", "tabWidth": 2, "printWidth": 120 }, // prettier格式化选项
    "type": "page",  // 生成代码类型：page、block、service
    "filePath": "pages/page1"   // 生成代码文件的相对目录路径
  },
  {
    "panelName": "page1.component.ts",
    "panelValue": "xxx",
    "panelType": "ts",
    "prettierOpt": { "parser": "typescript", "tabWidth": 2, "printWidth": 120 },
    "type": "page",
    "filePath": "pages/page1"
  },
  {
    "panelName": "block1.component.ts",
    "type": "block",
    "panelType": "ts",
    "prettierOpt": { "parser": "typescript", "tabWidth": 2, "printWidth": 120 },
    "filePath": "blocks/block1",
    "panelValue": "xxx"
  },
  {
    "panelName": "fetch.service.ts",
    "panelType": "ts",
    "prettierOpt": { "parser": "typescript", "tabWidth": 2, "printWidth": 120 },
    "type": "service",
    "filePath": "service",
    "panelValue": "xxx"
  },
  // ...
]
</code></pre>



### 请求参数

### 返回数据

<table>
  <thead class="ant-table-thead">
    <tr>
      <th key=name>名称</th><th key=type>类型</th><th key=required>是否必须</th><th key=default>默认值</th><th key=desc>备注</th><th key=sub>其他信息</th>
    </tr>
  </thead><tbody className="ant-table-tbody"><tr key=0><td key=0><span style="padding-left: 0px"><span style="color: #8c8a8a"></span> </span></td><td key=1><span>object []</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap"></span></td><td key=5><p key=3><span style="font-weight: '700'">item 类型: </span><span>object</span></p></td></tr><tr key=0-0><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> panelName</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">文件名</span></td><td key=5></td></tr><tr key=0-1><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> panelValue</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">文件文本</span></td><td key=5></td></tr><tr key=0-2><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> panelType</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">代码类型</span></td><td key=5></td></tr><tr key=0-3><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> prettierOpt</span></td><td key=1><span>object</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">代码美化选项</span></td><td key=5></td></tr><tr key=0-3-0><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> parser</span></td><td key=1><span>string</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">指定要使用的解析器</span></td><td key=5></td></tr><tr key=0-3-1><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> tabWidth</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">指定使用几个空格来表示一个制表符（Tab）</span></td><td key=5></td></tr><tr key=0-3-2><td key=0><span style="padding-left: 40px"><span style="color: #8c8a8a">├─</span> printWidth</span></td><td key=1><span>number</span></td><td key=2>非必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">指定每行代码的最大列数</span></td><td key=5></td></tr><tr key=0-4><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> type</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">代码类型</span></td><td key=5></td></tr><tr key=0-5><td key=0><span style="padding-left: 20px"><span style="color: #8c8a8a">├─</span> filePath</span></td><td key=1><span>string</span></td><td key=2>必须</td><td key=3></td><td key=4><span style="white-space: pre-wrap">文件路径</span></td><td key=5></td></tr>
               </tbody>
              </table>

