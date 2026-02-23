import { userBus } from './user.bus.js';
import { USER_EVENT } from '@transcendence/core';
import { FastifyInstance } from 'fastify';
import { profileService } from '../services/profiles.service.js';

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
          timestamp: Date.now(),
        }),
      );
      fastify.log.debug(`Event streamed to Redis for user ${profile.authId}`);
    } catch (err) {
      fastify.log.error(err, 'Failed to stream user event to Redis');
    }
  });
  userBus.on(USER_EVENT.UPDATED, async (username) => {
    const profile = await profileService.getProfileByUsername(username);
    try {
      // On utilise l'instance redis partagée par Fastify
      if (!profile) {
        fastify.log.warn(`Profile not found for username ${username}, skipping Redis event`);
        return;
      }
      await fastify.redis.xadd(
        'user.events',
        '*',
        'data',
        JSON.stringify({
          type: 'USER_UPDATED',
          id: profile.authId,
          username: profile.username,
          avatar: profile.avatarUrl,
          timestamp: Date.now(),
        }),
      );
      fastify.log.info(`Event streamed to Redis for user ${profile.authId}`);
    } catch (err) {
      fastify.log.error(err, 'Failed to stream user event to Redis');
    }
  });
}
