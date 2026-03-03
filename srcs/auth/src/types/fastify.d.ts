import 'fastify';
import { UserRequestDTO } from '@transcendence/core';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyRequest {
    sessionUser: UserRequestDTO;
  }
  interface FastifyInstance {
    redis: Redis;
  }
  interface FastifyContextConfig {
    skipAuth?: boolean;
  }
}
