import { Logger, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        let uri = process.env.DB_URL;
        if (__DEV__ || __TEST__) {
          const { MongoMemoryReplSet } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryReplSet.create({
            replSet: {
              count: 2,
            },
          });
          uri = mongod.getUri();
          Logger.log(`Memory server url is: ${uri}`, 'DbModule');
        }
        return {
          uri,
        };
      },
    }),
  ],
})
export class DbModule {}
