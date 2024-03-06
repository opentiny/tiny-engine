# dl-flow

dl-Flow 是一种拖拽式的线性网络搭建的 Web 应用程序。你可以使用该程序直观的搭建一个paddlepaddle的神经网络. 

## Quick Start

### Docker 搭建

我们非常推荐您使用Docker进行部署. 这不仅可以让你快速的进行上手, 也可以让您再后续对接其他程序更加的方便快捷(例如 K8s).

```yaml
# docker-compose.yaml
services:
  mongodb:
    image: mongo
    ports:
      - 27018:27017
  redis:
    image: redis
    ports:
      - 6379:6379
  front:
    image: gaonengwww/dl-flow-frontend
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
  server:
    image: gaonengwww/dl-flow-backend
    ports:
      - 9000:9000
    environment:
      - DB_URL=mongodb://mongodb:27017/dl-flow # 数据库地址
      - REDIS_HOST=redis # redis地址 (必填)
      - REDIS_PORT=6379 # redis端口 (必填)
      - REDIS_DB=0 # redis数据库 (必填)
      - REDIS_PASSWORD="" # redis密码
      - JWT_EXPIRE_IN="1d" # JWT 过期时间 (必填)
      - JWT_SIGN_ALGORITHM="RS256" # JWT签名算法, 要与密钥对符合, 例如密钥对是RSA 2048bit, 那么此处应该是 RS256 (必填)
      - JWT_PUB_KEY=./keys/key.pub # JWT 公钥 (必填)
      - JWT_PRI_KEY=./keys/key.pri # JWT 私钥 (必填)
      - PWD_SALT=salt # bcrypt 盐(必填)
    # volumes: # 强烈将下述卷挂载到本地, 以避免数据丢失
      # - ./_test/public:/public # 代码生成暂存位置
      # - ./_test/keys:/keys # 密钥对存放位置
      # - ./_test/data:/data # bundle.json与install.lock 存放位置
      
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

后端采用的是`Nest.js`

```bash
cd dl-flow-backend
pnpm install
pnpm build 
node dist/main.js
```

### 前端构建

前端魔改自`TinyEngine`, 部署方式与`TinyEngine`大同小异.

```bash
cd dl-flow-frontend
pnpm install
pnpm build:plugin
pnpm build:prod
cd packages/design-core/dist
```

### 环境变量与含义

- DB_URL: 数据库链接地址 (必填)
- REDIS_HOST: redis地址 (必填)
- REDIS_PORT: redis端口 (必填)
- REDIS_DB: redis数据库 (必填)
- REDIS_PASSWORD: redis密码 (必填)
- JWT_EXPIRE_IN: JWT过期时间, 规则可参考[vercel/ms](https://github.com/vercel/ms) (必填)
- JWT_SIGN_ALGORITHM: JWT签名算法, 要与密钥对符合, 例如密钥对是RSA 2048bit, 那么此处应该是 RS256 (必填)
- JWT_PUB_KEY: JWT 公钥 (必填)
- JWT_PRI_KEY: JWT 私钥 (必填)
- PWD_SALT: bcrypt 盐 (必填)

### Bug 反馈

如有bug与其他方面的疑问, 欢迎提交[issue](https://atomgit.com/opentiny/000003/issues)