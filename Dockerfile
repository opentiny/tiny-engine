FROM node:18-alpine as build

WORKDIR /app/
ADD . .
RUN npm config set strict-ssl false \
    && npm config set registry https://registry.npmmirror.com/ \
    && npm install pnpm -g \
    && pnpm i \
    && pnpm build:plugin \
    && pnpm build:prod

FROM nginx:latest
COPY --from=build /app/designer-demo/dist/ /usr/share/nginx/html/
