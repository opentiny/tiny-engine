# 更新日志

## v2.6

### 升级指南

[v2.6 升级指南](./v2.6-upgrade-guide.md)

### What's Change

#### 🎉 Exciting New Features

- **新的注册表声明方式**：采用基于唯一 ID 的扁平结构，更加灵活和精确
- **布局配置优化**：支持 `layoutConfig` 和 `relativeLayoutConfig` 两种布局配置方式
- **注册表热修复功能**：通过覆盖官方插件的特定函数或模板，实现紧急 bug 修复
- **默认注册表内置**：内置全量默认注册表，无需重复声明未修改的插件

#### 🐛 Bug Fixes

- 修复了多个与注册表相关的问题
- 优化了插件的加载和初始化流程

#### 📚 Documentation

- 新增 [v2.6 升级指南](./v2.6-upgrade-guide.md)
- 新增 [新注册表](../extension-capabilities-overview/new-registry.md) 文档
- 新增 [注册表高级配置](../extension-capabilities-overview/new-registry-advanced.md) 文档

#### ⚙️ Other changes

- 废弃插件 `align` 配置，改用布局配置来定位插件
- 废弃插件 `type: setting` 配置，统一使用 `type: plugins`
- 优化注册表合并机制，提高性能

## 完整的更新日志，请前往 [GitHub Release](https://github.com/opentiny/tiny-engine/releases) 查看。
