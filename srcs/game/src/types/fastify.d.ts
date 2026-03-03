import 'fastify';
import { Redis } from 'ioredis';
import { UserRequestDTO } from '@transcendence/core';

// Type for authenticate plugin and JWT data
declare module 'fastify' {
  interface FastifyInstance {
    recoveryHeaders: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    redis: Redis;
    closing: boolean;
  }
  interface FastifyRequest {
    user: UserRequestDTO;
  }
}
export {};
