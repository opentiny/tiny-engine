import { FastifyBaseLogger } from 'fastify';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


export default async (logger:FastifyBaseLogger) => {
  let uri = '';
  if (/* @__PURE__ */ __TEST__) {
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  try {
  await mongoose
    .connect(process.env.DB_URL ?? 'mongodb://localhost:27017/dl-flow', {
      directConnection: true,
      autoCreate: true
    });
    logger.info({}, 'MongoDB Connect Success');
  } catch (err) {
    logger.error(err);
  }
};


export * from './layer.shema';
export * from './property.schema';