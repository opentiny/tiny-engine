import { FastifyInstance } from 'fastify';
import { LayerModel } from '~/db/';

export default (fastify: FastifyInstance) => {
  fastify.get('/layers', async (req, rep) => {
    const data = await LayerModel.find({});
    console.log(data);
    rep.send('hello-world');
    
  });
};
