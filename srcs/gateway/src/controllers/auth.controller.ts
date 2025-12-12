import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { proxyRequest } from '../utils/proxy.js'
import { logger, logUtils } from '../utils/logger.js'

const AUTH_SERVICE_URL = 'http://auth-service:3001'

export async function authRootHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return proxyRequest(this, request, reply, `${AUTH_SERVICE_URL}/`)
}

export async function authHealthHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  logger.logHealth({ serviceName: 'auth-service' }, 'service_check')
  return proxyRequest(this, request, reply, `${AUTH_SERVICE_URL}/health`)
}

export async function loginHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const startTime = Date.now()
  const username = (req.body as any)?.username || (req.body as any)?.email || 'unknown'
  const sanitizedBody = logUtils.sanitizeForLog(req.body)

  req.log.info({
    event: 'auth_login_attempt',
    username,
    body: sanitizedBody,
  })

  const res = await proxyRequest(this, req, reply, `${AUTH_SERVICE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })

  req.log.info({
    event: 'auth_login_result',
    status: reply.statusCode,
    username,
    success: reply.statusCode === 200,
    duration: Date.now() - startTime,
  })

  return res
}

export async function registerHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const startTime = Date.now()
  const { username = 'unknown', email = 'unknown' } = req.body as any
  const sanitizedBody = logUtils.sanitizeForLog(req.body)

  req.log.info({
    event: 'auth_register_attempt',
    username,
    email,
    body: sanitizedBody,
  })

  const res = await proxyRequest(this, req, reply, `${AUTH_SERVICE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })

  req.log.info({
    event: 'auth_register_result',
    status: reply.statusCode,
    username,
    email,
    success: reply.statusCode === 201,
    duration: Date.now() - startTime,
  })

  return res
}

export async function logoutHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const user = (req.headers as any)['x-user-name'] || null

  req.log.info({
    event: 'auth_logout',
    user,
  })

  const res = await proxyRequest(this, req, reply, `${AUTH_SERVICE_URL}/logout`, {
    method: 'POST',
  })

  req.log.info({
    event: 'auth_logout_result',
    status: reply.statusCode,
    user,
    success: reply.statusCode === 200,
  })

  return res
}

// DEV ONLY - À supprimer en production
export async function meHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Route DEV ONLY - À supprimer en production
  req.log.warn({
    event: 'dev_route_accessed',
    route: '/api/auth/me',
    user: (req.headers as any)['x-user-name'] || null,
    warning: 'This route exposes internal headers and should be removed in production',
  })

  return proxyRequest(this, req, reply, `${AUTH_SERVICE_URL}/me`)
}

export async function listHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const user = (req.headers as any)['x-user-name'] || null

  req.log.info({
    event: 'auth_list_users_attempt',
    user,
  })

  const res = await proxyRequest(this, req, reply, `${AUTH_SERVICE_URL}/list`, {
    method: 'GET',
  })

  req.log.info({
    event: 'auth_list_users_result',
    status: reply.statusCode,
    user,
    success: reply.statusCode === 200,
  })

  return res
}
