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