import { userBus } from './user.bus.js';
import { USER_EVENT } from '@transcendence/core';
import { FastifyInstance } from 'fastify';

/* init the function that listen interne/container events
 *
 */
export function initRedisSubscriber(fastify: FastifyInstance) {
  userBus.on(USER_EVENT.CREATED, async (profile) => {
    try {
      // On utilise l'instance redis partagée par Fastify
      await fastify.redis.xadd(
        'user.events',
        '*',
        'data',
        JSON.stringify({
          type: 'USER_CREATED',
          id: profile.authId,
          username: profile.username,
          avatar: profile.avatar,
          timestamp: Date.now(),
        }),
      );
      fastify.log.debug(`Event streamed to Redis for user ${profile.id}`);
    } catch (err) {
      fastify.log.error(err, 'Failed to stream user event to Redis');
    }
  });
}
