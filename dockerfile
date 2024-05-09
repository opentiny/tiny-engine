FROM node:18 as builder
WORKDIR /CODE
ADD . /CODE/

RUN npm install pnpm -g && \ 
    pnpm install && \
    pnpm build:frontend

FROM nginx as RUNNER
COPY --from=builder /CODE/dl-flow-frontend/packages/design-core/dist /usr/share/nginx/html
VOLUME [ "/etc/nginx/nginx.conf", "/etc/nginx/conf.d", "/var/log/nginx"]
EXPOSE 80
