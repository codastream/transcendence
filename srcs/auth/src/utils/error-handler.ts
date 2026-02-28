import {
  AppError,
  panicErrorToLog,
  fastifyValidationErrorToLog,
  fastifyErrorToReplyPayload,
  appErrorToLog,
  appErrorToReplyPayload,
  FastifyValidationError,
  rateLimitErrorToLog,
  rateLimitErrorToReplyPayload,
  replySentToLog,
} from '@transcendence/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyError } from 'fastify';

const RATE_LIMIT_CODES = new Set(['FST_ERR_RATE_LIMITED', 'FST_ERR_RATE_LIMIT']);

const isRateLimitError = (error: FastifyError): boolean =>
  RATE_LIMIT_CODES.has(error.code) || error.message?.includes('Rate limit exceeded') === true;

export async function errorHandler(
  error: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // theoretically should have been already logged while sent, no need to double log
  if (reply.sent) {
    req.log.debug(replySentToLog(error, req));
    return;
  }

  if (isRateLimitError(error)) {
    const retryAfterSeconds = reply.getHeader('Retry-After')
      ? Math.ceil(Number(reply.getHeader('Retry-After')))
      : 60;
    req.log.warn(rateLimitErrorToLog(error, req, retryAfterSeconds));
    const { status, body } = rateLimitErrorToReplyPayload(retryAfterSeconds);
    return reply.status(status).send(body);
  }

  if (error.code === 'FST_ERR_VALIDATION') {
    req.log.error(fastifyValidationErrorToLog(error as unknown as FastifyValidationError, req));
    const { status, body } = fastifyErrorToReplyPayload(error as unknown as FastifyValidationError);
    return reply.status(status).send(body);
  }

  if (error instanceof AppError) {
    req.log.error(appErrorToLog(error, req), error.message);
    const { status, body } = appErrorToReplyPayload(error);
    return reply.status(status).send(body);
  }

  req.log.error(panicErrorToLog(error, req), error.message || 'Unexpected error');
  return reply.status(500).send({ message: 'Unexpected error' });
}
