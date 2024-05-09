import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import {
  RedisModule as Redis,
  RedisModuleOptions,
} from '@liaoliaots/nestjs-redis';

export const memoryRedis = async () => {
  if (__DEV__ || __TEST__) {
    const { RedisMemoryServer } = await import('redis-memory-server');
    const server = new RedisMemoryServer({
      instance: {
        ip: '127.0.0.1',
        port: 6379,
      },
    });
    await server.start();
    return server;
  }
};

@Module({
  providers: [RedisService],
  exports: [RedisService],
  imports: [
    Redis.forRootAsync({
      useFactory: async (): Promise<RedisModuleOptions> => {
        if (__DEV__ || __TEST__) {
          const server = await memoryRedis();
          return {
            config: {
              host: await server.getIp(),
              port: await server.getPort(),
            },
          };
        }
        return {
          readyLog: true,
          config: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            db: process.env.REDIS_DB,
            password: process.env.REDIS_PASSWORD,
          },
        };
      },
    }),
  ],
})
export class RedisModule {}
