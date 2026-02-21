import { env } from '../config/env.js';
import type { Redis } from 'ioredis';
import { FastifyInstance } from 'fastify';
import { UserEvent, USER_EVENT } from '@transcendence/core';
import { upsertUser, deleteUser } from './game.database.js';

const STREAM = 'user.events';
const GROUP = 'game-service-group';
const CONSUMER = 'consumer-1';

const PENDING_IDLE_MS = 30_000; // 30s avant reclaim
const RECOVERY_INTERVAL = 10; // toutes les 10 itérations

/* initialisation of the main consumer function
 * @function redis.xgroup create the group of the stream
 *    $ only new message after group creation
 *    0 replay all message
 *    if th group exist XGROUP DESTROY user.events game-service-group
 */
export async function startGameConsumer(app: FastifyInstance) {
  if (!app.redis) {
    app.log.warn('Redis not available, game consumer disabled');
    return;
  }

  const redis = app.redis;

  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
  } catch {
    // group already exists
  }
  //main conumer loop
  consumeLoop(app, redis).catch((err) => app.log.error({ err }, 'Game consumer fatal error'));
}
/* listen the Stream and consume each messages
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function consumeLoop(app: FastifyInstance, redis: any): Promise<void> {
  let loopCount = 0;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  while (!app.closing) {
    try {
      loopCount++;

      if (loopCount % RECOVERY_INTERVAL === 0) {
        await recoverPending(app, redis);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const streams = await redis.xreadgroup(
        'GROUP',
        GROUP,
        CONSUMER,
        'BLOCK',
        5000,
        'COUNT',
        1,
        'STREAMS',
        STREAM,
        '>',
      );

      if (!streams) continue;
      // each message is formated like {key , message, ... , key, message}
      const [[, messages]] = streams;
      for (const [id, fields] of messages) {
        await processMessage(app, redis, id, fields);
      }
    } catch (err: unknown) {
      app.log.warn({ err }, 'Consumer loop error');
      if (app.closing) break;
      await sleep(500);
    }
  }
}

async function processMessage(
  app: FastifyInstance,
  redis: Redis,
  id: string,
  fields: string[],
): Promise<void> {
  try {
    //fields[1] is key:data message:{UserEvent}
    const data = JSON.parse(fields[1]) as UserEvent;

    switch (data.type) {
      case USER_EVENT.CREATED:
      case USER_EVENT.UPDATED:
        await upsertUser(data);
        break;

      case USER_EVENT.DELETED:
        await deleteUser(data.id);
        break;

      default:
        app.log.warn({ data }, `Unknown user event type`);
    }

    await redis.xack(STREAM, GROUP, id);
  } catch (err) {
    app.log.error({ err, streamId: id }, 'User event processing failed');
    throw err;
  }
}

async function recoverPending(app: FastifyInstance, redis: Redis) {
  const pending = await redis.xpending(STREAM, GROUP, '-', '+', 10);
  for (const entry of pending as any[]) {
    const messageId = entry[0];
    const idleTime = entry[2];
    if (idleTime > PENDING_IDLE_MS) {
      await redis.xclaim(STREAM, GROUP, CONSUMER, PENDING_IDLE_MS, messageId);
      app.log.info({ messageId }, 'Reclaimed pending message');
    }
  }
}
