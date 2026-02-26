import 'fastify';
import '@fastify/jwt';
import { Redis } from 'ioredis';

// Type for authenticate plugin and JWT data
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    closing: boolean;
  }
}
