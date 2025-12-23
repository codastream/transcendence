import { createProfile, getProfileByUsername } from '../controllers/um.controller.js';
import {
  getFriendsByUserId,
  addFriend,
  removeFriend,
  updateFriend,
} from '../controllers/friends.controller.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function umRoutes(app: FastifyInstance) {
  app.get('/', async function (this: FastifyInstance) {
    return { message: 'User management service is running' };
  });

  app.get(
    '/health',
    async function (this: FastifyInstance, _request: FastifyRequest, reply: FastifyReply) {
      return reply.code(200).send({ status: 'healthy new' });
    },
  );

  app.get('/users/:username', getProfileByUsername);
  app.get('/users/friends/', getFriendsByUserId);
  app.post('/users/friends', addFriend);
  app.delete('/users/friends/:targetId', removeFriend);
  app.put('/users/friends/:targetId', updateFriend);

  app.post('/users', createProfile);
}
