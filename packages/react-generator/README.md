## 使用方式

首先，可以通过 packages\design-core\config\lowcode.config.js 路径下修改全局配置，若想要查看 React 出码与预览，则需要将此 dslmode 改为 React

![](https://cdn.nlark.com/yuque/0/2024/png/29733541/1730338309023-d3f73e40-f9ca-4100-9b23-2c27d648099e.png)

然后便可以开始 React 的出码操作了，如视频所示：

[QQ20241031-95421.mp4](https://www.yuque.com/attachments/yuque/0/2024/mp4/29733541/1730339785149-07b5dc8f-bb71-4ece-b788-2a00cb48f2a7.mp4)

接下来也可以看一下预览操作，如视频所示：

[QQ20241031-101948.mp4](https://www.yuque.com/attachments/yuque/0/2024/mp4/29733541/1730341217144-3f724301-4a79-4570-bc1a-cd49df5153a6.mp4)

## 设计文档

### 出码

主要设计思路如下：

![](https://cdn.nlark.com/yuque/0/2024/png/29733541/1730377909769-056f964b-97cf-4ace-9b73-7c470c5ceb33.png)

总体来说，将整个出码分为 plugin 插件，内置在代码中的文件模板 ，对 schema 的 parse 解析器以及最终组装生成代码的 generator 四部分组成

### 预览

预览的设计思路主要为通过打开预览界面的时候内置一个 iframe，iframe 使用 React 编写，并通过 React Live 实现 React 代码的预览，在 Ifram 与 vue 中通过 postmessgae 进行通信与确认信息
