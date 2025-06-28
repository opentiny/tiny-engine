# 静态资源目录

此目录用于存放应用的静态资源文件，如图片、字体、音频等。

## 目录结构建议

```
static/
├── images/       # 图片资源
│   ├── icons/    # 图标
│   ├── logo/     # Logo相关
│   └── common/   # 通用图片
├── fonts/        # 字体文件
├── audio/        # 音频文件
└── video/        # 视频文件
```

## 使用说明

1. 静态资源在项目中可以通过相对路径引用：
   ```html
   <!-- 在Vue模板中 -->
   <image src="/static/images/logo.png"></image>
   ```

2. 在CSS中引用：
   ```css
   background-image: url(/static/images/bg.png);
   ```

3. 在JS中引用：
   ```js
   const logoPath = '/static/images/logo.png';
   ```

## 注意事项

1. 建议对大型静态资源进行压缩，以减小应用体积
2. 考虑使用CDN托管大型静态资源
3. 图片资源建议使用webp格式以获得更好的压缩率
4. 不要在此目录中存放敏感信息
5. 避免存放过大的静态文件，可能会影响应用性能

## 默认资源

- logo.png: 应用默认Logo
- placeholder.png: 图片占位符
- favicon.ico: 网站图标（H5平台使用）