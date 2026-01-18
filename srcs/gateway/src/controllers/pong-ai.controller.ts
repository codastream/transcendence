import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { proxyRequest, webSocketProxyRequest } from '../utils/proxy.js';

export function registerAiRoutes(app: FastifyInstance) {
  // Regular HTTP routes
  app.get('/invite-pong-ai', async (request, reply) => {
    app.log.info({ event: 'invite_pong_ai', remote: 'pong-ai', url: '/invite-pong-ai' });
    const res = await proxyRequest(
      app,
      request,
      reply,
      'http://pong-ai-service:3006/invite-pong-ai',
    );
    return res;
  });
}
