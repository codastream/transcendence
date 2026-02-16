import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

/* Creation of a plugin to retrieve user information from their JWT token.
 * This plugin will be included as a prehandler for requests.
 *
 */
export default fp(async function (app) {
  app.register(fastifyCookie);
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });
  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.warn(message);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
