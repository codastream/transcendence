import { FastifyRequest } from 'fastify';
import { UserRequestDTO } from '@transcendence/core';
import { MultipartFile } from '@fastify/multipart';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyRequest {
    user: UserRequestDTO;
    file(): Promise<MultipartFile | undefined>;
  }
  interface FastifyInstance {
    redis: Redis;
  }
  interface FastifyContextConfig {
    skipAuth?: boolean;
  }
}
