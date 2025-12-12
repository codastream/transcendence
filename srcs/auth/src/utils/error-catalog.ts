import { ErrorDefinition } from "../types/errors.js";
import { EVENTS, REASONS } from "./constants.js";

// Factory pattern to centralize error generation

// 401 Unauthorized or 403 Forbidden
const loginError = (reason: string, message: string, statusCode = 401): ErrorDefinition => ({
  event: EVENTS.AUTH.LOGIN_FAILURE,
  statusCode,
  reason,
  message,
});

// 409 Conflicts or 400 Bad Request - Validation
const registerError = (reason: string, message: string, statusCode = 409): ErrorDefinition => ({
  event: EVENTS.AUTH.REGISTER_FAILURE,
  statusCode,
  reason,
  message,
});

// 401 Unauthorized
const authBlockError = (reason: string, message: string): ErrorDefinition => ({
  event: EVENTS.AUTH.AUTH_BLOCKED,
  statusCode: 401,
  reason,
  message,
});

// 503 Unavailable or 504 Timeout
const systemError = (reason: string, message: string, statusCode = 503): ErrorDefinition => ({
  event: EVENTS.UPSTREAM.FAILURE,
  statusCode,
  reason,
  message,
});


export const APP_ERRORS = {
  // === LOGIN ===
  LOGIN_BAD_CREDENTIALS: loginError(REASONS.SECURITY.BAD_CREDENTIALS, 'Invalid email or password'),
  LOGIN_USER_NOT_FOUND:  loginError(REASONS.SECURITY.USER_NOT_FOUND, 'User not found'),
  LOGIN_ACCOUNT_LOCKED:  loginError(REASONS.SECURITY.ACCOUNT_LOCKED, 'Account is locked due to too many failed attempts', 403),
  LOGIN_MISSING_FIELDS:  loginError(REASONS.VALIDATION.MISSING_FIELD, 'Email and password are required', 400),

  // === REGISTER ===
  REG_EMAIL_EXISTS:   registerError(REASONS.CONFLICT.EMAIL_EXISTS, 'Email address is already in use'),
  REG_USERNAME_TAKEN: registerError(REASONS.CONFLICT.USERNAME_TAKEN, 'Username is already taken'),
  REG_WEAK_PASSWORD:  registerError(REASONS.VALIDATION.WEAK_PASSWORD, 'Password does not meet security requirements', 400),

  // === GATEWAY ===
  TOKEN_EXPIRED: authBlockError(REASONS.SECURITY.TOKEN_EXPIRED, 'Session token has expired'),
  TOKEN_INVALID: authBlockError(REASONS.SECURITY.TOKEN_INVALID, 'Invalid token signature'),
  NO_TOKEN:      authBlockError(REASONS.SECURITY.MISSING_TOKEN, 'Authentication header missing'),

  // === SYSTEM / INTER-SERVICE ===
  UM_TIMEOUT:     systemError(REASONS.NETWORK.TIMEOUT, 'User Service request timed out'),
  UM_DNS_FAIL:    systemError(REASONS.NETWORK.DNS_FAILED, 'Cannot resolve User Service hostname'),
  UM_UNAVAILABLE: systemError(REASONS.NETWORK.UPSTREAM_ERROR, 'User Service returned an error'),
} as const;