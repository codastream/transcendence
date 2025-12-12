import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as authService from '../services/auth.service.js'
import { ValidationSchemas } from '../utils/validation.js'

export async function registerHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Validation Zod
  const validation = ValidationSchemas.register.safeParse(req.body)
  if (!validation.success) {
    this.log.warn({ event: 'register_validation_failed', errors: validation.error.issues })
    return reply.code(400).send({
      error: {
        message: 'Invalid registration data',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      },
    })
  }

  const { username, email, password } = validation.data
  req.log.info({ event: 'register_attempt', username, email })

  try {
    if (authService.findByUsername(username)) {
      req.log.warn({ event: 'register_failed', username, reason: 'user_exists' })
      return reply
        .code(400)
        .send({ error: { message: 'User already exists', code: 'USER_EXISTS' } })
    }
    if (authService.findByEmail(email)) {
      req.log.warn({ event: 'register_failed', email, reason: 'email_exists' })
      return reply
        .code(400)
        .send({ error: { message: 'Email already in use', code: 'EMAIL_EXISTS' } })
    }
  } catch (err: any) {
    req.log.error({ event: 'register_validation_error', username, email, err: err?.message || err })
    if (err && err.code === 'DB_FIND_USER_BY_USERNAME_ERROR') {
      return reply.code(500).send({
        error: {
          message: 'Database error during username verification',
          code: 'DB_FIND_USER_BY_USERNAME_ERROR',
        },
      })
    }
    if (err && err.code === 'DB_FIND_USER_BY_EMAIL_ERROR') {
      return reply.code(500).send({
        error: {
          message: 'Database error during email verification',
          code: 'DB_FIND_USER_BY_EMAIL_ERROR',
        },
      })
    }
    return reply
      .code(500)
      .send({ error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } })
  }

  try {
    const id = authService.createUser({ username, email, password })
    req.log.info({ event: 'register_success', username, email, id })
    return reply.code(201).send({ result: { message: 'User registered successfully', id } })
  } catch (err: any) {
    req.log.error({ event: 'register_error', username, email, err: err?.message || err })
    // Add errors handling
    if (err && err.code === 'USER_EXISTS') {
      return reply
        .code(400)
        .send({ error: { message: err.message || 'User already exists', code: 'USER_EXISTS' } })
    }
    if (err && err.code === 'EMAIL_EXISTS') {
      return reply
        .code(400)
        .send({ error: { message: err.message || 'Email already in use', code: 'EMAIL_EXISTS' } })
    }
    if (err && err.code === 'DB_CREATE_USER_ERROR') {
      return reply.code(500).send({
        error: { message: 'Internal error during user creation', code: 'DB_CREATE_USER_ERROR' },
      })
    }
    if (err && err.code === 'UNIQUE_VIOLATION') {
      return reply.code(400).send({
        error: {
          message: 'Data conflicts with uniqueness constraints',
          code: 'UNIQUE_VIOLATION',
        },
      })
    }

    // Else internal server error
    return reply
      .code(500)
      .send({ error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } })
  }
}

export async function loginHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Validation Zod
  const validation = ValidationSchemas.login.safeParse(req.body)
  if (!validation.success) {
    req.log.warn({ event: 'login_validation_failed', errors: validation.error.issues })
    return reply.code(400).send({
      error: {
        message: 'Invalid login data',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      },
    })
  }

  const { username, email, password } = validation.data
  const identifier = username || email

  // TypeScript safety check
  if (!identifier) {
    req.log.warn({ event: 'login_failed', reason: 'missing_identifier' })
    return reply
      .code(400)
      .send({ error: { message: 'Username or email required', code: 'MISSING_IDENTIFIER' } })
  }

  req.log.info({ event: 'login_attempt', identifier })

  try {
    const user = authService.findUser(identifier)
    const valid = user && authService.validateUser(identifier, password)
    if (!valid) {
      req.log.warn({ event: 'login_failed', identifier, reason: 'invalid_credentials' })
      return reply
        .code(401)
        .send({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } })
    }

    const payload = {
      sub: user.id || 0,
      username: user.username,
    }

    const token = this.jwt.sign(payload, { expiresIn: '1h' })
    req.log.info({ event: 'login_success', identifier })
    reply
      .setCookie('token', token, {
        httpOnly: true,
        secure: (globalThis as any).process?.env?.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60, // 1h comme le JWT
      })
      .code(200)
      .send({ result: { message: 'Login successful' } })
  } catch (err: any) {
    req.log.error({ event: 'login_error', identifier, err: err?.message || err })
    if (err && err.code === 'DB_FIND_USER_BY_IDENTIFIER_ERROR') {
      return reply.code(500).send({
        error: {
          message: 'Database error during user lookup',
          code: 'DB_FIND_USER_BY_IDENTIFIER_ERROR',
        },
      })
    }
    return reply
      .code(500)
      .send({ error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } })
  }
}

export async function logoutHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const username = (req.headers as any)['x-user-name'] || null
  req.log.info({ event: 'logout', user: username })
  return reply.clearCookie('token').send({ result: { message: 'Logged out successfully' } })
}

// DEV ONLY - À supprimer
export async function meHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const username = (req.headers as any)['x-user-name'] || null
  const idHeader = (req.headers as any)['x-user-id'] || null
  const id = idHeader ? Number(idHeader) : null
  req.log.info({ event: 'me_request_dev_only', user: username, id })
  return reply.code(200).send({ data: { user: username ? { id, username } : null } })
}

export async function listAllUsers(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const username = (req.headers as any)['x-user-name'] || null
  req.log.info({ event: 'list_users_attempt', user: username })
  if (username !== 'admin')
    return reply.code(403).send({ error: { message: 'Forbidden', code: 'FORBIDDEN' } })
  try {
    const users = authService.listUsers()
    req.log.info({ event: 'list_users_success', user: username, count: users.length })
    return reply.code(200).send({ result: { users } })
  } catch (err: any) {
    req.log.error({ event: 'list_users_error', user: username, err: err?.message || err })
    return reply
      .code(500)
      .send({ error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } })
  }
}
