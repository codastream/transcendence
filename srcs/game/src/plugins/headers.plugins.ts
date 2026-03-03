import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import * as db from '../core/game.database.js';

export default fp(async function (app) {
  app.decorate('recoveryHeaders', async function (req: FastifyRequest, reply: FastifyReply) {
    const idHeader = (req.headers as any)['x-user-id'];
    const usernameHeader = req.headers['x-user-name'];
    const userId = idHeader ? Number(idHeader) : null;
    if (!userId) {
      app.log.warn(`invalid auth header - user id missing`);
      return reply.code(400).send({ code: 'NOT_VALID_USER', message: "This user don't exist" });
    }
    const userExist = db.getUser(userId);
    if (!userExist) {
      app.log.warn(`invalid auth header - user not found`);
      return reply.code(400).send({ code: 'NOT_VALID_USER', message: "This user don't exist" });
    }
    req.user = {
      id: userId,
      username: String(usernameHeader),
    };
  });
});
