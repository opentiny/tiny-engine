import { App } from './app';

export async function bootstrap() {
    const app = await App();
    app.listen({
      host: '0.0.0.0',
      port: 9000,
    }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit();
      }
    });
}
bootstrap();
// let app: FastifyInstance;
// async function bootstrap() {
//   console.clear();
//   app = fastify();
//   await Mongo(app.log);
//   app.log.info('Plugin Load success');
//   app.listen({
//     host: '0.0.0.0',
//     port: 9000,
//   }, (err) => {
//     if (err) {
//       app.log.error(err);
//       process.exit();
//     }
//   });
//   (await import('~/layer/layer.controller')).default(app);
// }

// bootstrap();

// export const getApp = async () => app;