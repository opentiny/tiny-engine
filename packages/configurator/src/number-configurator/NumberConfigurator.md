# NumberConfigurator

## 属性

addonAfter: 显示的单位
showUnit: value 中是否显示单位
units: 切换单位时单位列表
selectedUnit: 选中的单位
unitSelectWidth: select 框的宽度，默认 25px

## 场景

### 组件单位显示场景

1. 值为数字类型，不需要单位，但在末尾需要显示默认的单位：

```js
"addonAfter": "Mbit/s"
```

2. 组件值包含单位，为字符串类型： 如 '5Mbit/s'

```js
"addonAfter": "Mbit/s"
"showUnit": true
```

3. 组件值包含单位，为字符串类型： 如 '5Mbit/s'，也需要支持通过点击下拉列表切换单位：

```js
// 不用配置addonAfter，如果配置了就是场景2
"showUnit": true
"units": [
  {
    "value": "Mbit/s",
    "label": "Mbit/s"
  }
],
"selectedUnit": "Mbit/s",
"unitSelectWidth": "60px"
```
