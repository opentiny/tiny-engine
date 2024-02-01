FROM node:18 as builder
WORKDIR /code
ADD . /code/
RUN npm install -g pnpm && pnpm install && pnpm build 

FROM node:18-alpine as runner
WORKDIR /app
COPY --from=builder /code/dist ./dist
COPY --from=builder /code/node_modules ./node_modules

ENV DB_URL=""

EXPOSE 9000
CMD [ "node","dist/app.js" ]

