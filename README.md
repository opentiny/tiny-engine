# dl-flow

Dl-Flow 是一种拖拽式的线性网络搭建的 Web 应用程序。你可以使用该程序直观的搭建一个paddlepaddle的线性网络。

> Powered by 

## Quick Start

### Docker 搭建

我们非常推荐您使用Docker进行部署. 这不仅可以让你快速的进行上手, 也可以让您再后续对接其他程序更加的方便快捷(例如 K8s).

```yaml
# docker-compose.yaml
version: '3'

services:
  front:
    image: gaonengwww/dl-flow-frontend
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
  mongodb:
    image: mongo
    ports:
      - 27018:27017
  server:
    image: gaonengwww/dl-flow-backend
    ports:
      - 9000:9000
      - 9001:9001
    environment:
      - DB_URL=mongodb://mongodb:27017/dl-flow
```

`Web-Ui` 使用nginx驱动, 接下来我们需要编写 `nginx.conf`

```conf
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    gzip on;
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
        }
        location ~ /endpoint/ {
            rewrite ^/endpoint/(.*)$ /$1 break; # 主要负责反代的rewrite, 否则发的是 http://server:9000/endpoint/
            proxy_pass http://server:9000;
        }
        location ~ /socket.io {
            proxy_pass http://server:9001;

            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

    }
}
```

```bash
docker compose up -d
```

接下来，您便可以访问 `http://localhost` 开始搭建


## 源码构建

```bash
git clone https://atomgit.com/opentiny/000003.git
# git clone git@atomgit.com:opentiny/000003.git
ls -al
# .github
# dl-flow-backend  // 后端
# dl-flow-frontend // WebUi
# dl-flow.code-workspace
# docker-compose.yaml // 预设好的docker-compose文件
# nginx.conf // 预设好的nginx文件
```

### 后端构建

后端采用的是`Nest.js` + `MongoDB`的形式，故需要先安装MongoDB. 这里不做演示

```bash
cd dl-flow-backend
pnpm install
pnpm build 
echo DB_URL=mongodb://localhost:27017:/dl-flow >> .env
node dist/main.js
```

### 前端构建

前端魔改自`TinyEngine`, 部署方式与`TinyEngine`大同小异.

```bash
cd dl-flow-frontend
pnpm install
pnpm build:plugin
pnpm build:prod
cd packages/design-core/dist # 之后你便可以使用nginx或candy驱动
```

