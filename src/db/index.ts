import { FastifyBaseLogger } from 'fastify';
import mongoose from 'mongoose';


export default (logger:FastifyBaseLogger) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.DB_URL ?? 'mongodb://localhost:27017/dl-flow', {
        directConnection: true,
      })
      .then(() => { logger.info({}, 'MongoDB Connect Success');resolve(true); })
      .catch((err) => { logger.error(err);reject(err); });
  });
};
