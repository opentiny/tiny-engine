import { FastifyInstance } from 'fastify';

export default (fastify: FastifyInstance) => {
  fastify.get('/', (req, rep) => {
    rep.send('hello-world');
  });
};
