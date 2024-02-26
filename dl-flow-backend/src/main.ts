import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { parse } from 'dotenv';
import { readFileSync } from 'fs';

async function bootstrap() {
  if (__DEV__) {
    parse(readFileSync('.env').toString());
  }
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(9000);
}
bootstrap();
