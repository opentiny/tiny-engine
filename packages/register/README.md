# meta-register

## configurators

往设计器添加 metaComponent，满足右侧属性面板属性设置器自定义组件的需求

### addConfigurator

```javascript
addConfigurator([
  {
    name: 'InputConfigurator',
    component: InputConfigurator
  },
  {
    name: 'SelectConfigurator',
    component: SelectConfigurator
  }
])
```

### getConfigurator

```javascript
getConfigurator('InputConfigurator')
```
