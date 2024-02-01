import dotenv from 'dotenv';
import Mongo from '~db/index';
import fastify from 'fastify';
import { join } from 'path';
dotenv.config({
  path: join(__dirname, '.env')
});
async function bootstrap() {
  console.clear();
  const app = fastify({
    logger: process.env.NODE_ENV === 'dev' ? {
      transport: {
        target: 'pino-pretty',
        options:{
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
      level: 'debug'
    } : true,
  });
  Mongo(app.log);
  app.log.info('Plugin Load success');
  app.listen({
    host: '0.0.0.0',
    port: 9000,
  }, (err) => {
    if (err) {
      app.log.error(err);
    }
  });
  (await import('~/user/user.controller')).default(app);
}

bootstrap();
