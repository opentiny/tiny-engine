# 布局模块

## 布局元应用

布局元应用配置如下

```javascript
{
  options: {
    configProvider, // 全局配置组件
    configProviderDesign // 规范，可以通过该属于定制一些自定义的交互规范
  },
  metas: [LayoutService]
}
```

## 布局元服务

布局元服务api如下

```javascript
{
  apis: {
    PLUGIN_NAME, // 对象，插件对应的元应用id
    activePlugin, // 激活plugin面板，参数（插件名，是否激活对应面板）
    activeSetting, // 激活setting面板并高亮提示，参数（属性名）
    closePlugin, // 关闭插件面板，参数（是否强制关闭）
    getDimension, // 获取样式范围
    getPluginState,  // 获取插件面板状态
    getScale, // 获取规定比例
    isEmptyPage, // 判断页面状态是否为空
    layoutState, // 对象，layout状态
    pluginState, // 对象，插件状态 
    setDimension // 设置样式范围
  }
}
```

### 