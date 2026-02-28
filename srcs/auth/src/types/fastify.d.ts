import { FastifyRequest } from 'fastify';
import { UserRequestDTO } from '@transcendence/core';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyRequest {
    user: UserRequestDTO;
  }
  interface FastifyInstance {
    redis: Redis;
  }
  interface FastifyContextConfig {
    skipAuth?: boolean;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserRequestDTO;
    user: UserRequestDTO;
  }
}
