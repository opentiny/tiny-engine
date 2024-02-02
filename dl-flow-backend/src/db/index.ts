import { FastifyBaseLogger } from 'fastify';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


export default async (logger:FastifyBaseLogger) => {
  let uri = '';
  if (/* @__PURE__ */ __TEST__ || __DEV__) {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'test',
      },
    });
    uri = mongod.getUri();
  }
  try {
    const url = (__TEST__||__DEV__) ? uri : process.env.DB_URL ?? 'mongodb://localhost:27017/dl-flow';
  await mongoose
    .connect(url, {
      directConnection: true,
      autoCreate: true
    });
    logger.info({}, `Connect ${url} Success`);
  } catch (err) {
    logger.error(err);
  }
};


export * from './layer.shema';
export * from './property.schema';