import fastify from 'fastify';
import dotenv from 'dotenv';
import Mongo from '~db/index';
import { join } from 'path';
dotenv.config({
  path: join(__dirname, '.env')
});
export async function App() {
    const app = fastify({
      logger: (__DEV__ || __TEST__) ? {
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
    app.log.debug({}, `Env: ${__TEST__ ? 'Test' : __DEV__ ? 'DEV' : 'Prod'}`);
    app.log.info({}, 'Prepare install Mongo');
    await Mongo(app.log);
    // TODO: auto register controller
    (await import('~/layer/layer.controller')).default(app);
    return app;
}