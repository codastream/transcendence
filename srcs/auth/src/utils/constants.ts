// for controller and service layer
export const EVENTS = {
    AUTH: {
        LOGIN_FAILURE: "auth_login_failure",
        LOGIN_SUCCESS: "auth_login_success",
        REGISTER_FAILURE: "auth_register_failure",
        REGISTER_SUCCESS: "auth_register_success",
        AUTH_BLOCKED: "auth_blocked",                   // blocked on gateway
        AUTH_SUCCESS: "auth_success",
    },
    INFRA: {
        REDIS_CONNECT: "infra_redis_connected",
        REDIS_DISCONNECT: 'infra_redis_disconnected',
        REDIS_ERROR: 'infra_redis_error',
        DB_CONNECT: 'infra_db_connected',
        DB_ERROR: 'infra_db_error',
        ROLLBACK: 'infra_rollback_execution',
    },
    SERVICE: {
        READY: 'service_ready',
        FAIL: 'service_failure',
    },
    UPSTREAM: {                                 // for inter-services
        REQUEST: 'upstream_request',          
        SUCCESS: 'upstream_success',            // 200
        FAILURE: 'upstream_failure',            // 4xx/5xx
        TIMEOUT: 'upstream_timeout',
    },
    VALIDATION: {
        REQUEST_FAILED: 'validation_request_failed',
    },
    EXCEPTION: {
        INTERNAL: 'exception_internal_error',
        UNHANDLED: 'exception_unhandled',
    }
} as const;

// for controller and service layer
export const REASONS = {
  SECURITY: {
    BAD_CREDENTIALS: 'bad_credentials',
    USER_NOT_FOUND: 'user_not_found',
    ACCOUNT_LOCKED: 'account_locked',
    TOKEN_EXPIRED: 'token_expired',
    TOKEN_INVALID: 'token_invalid',
    MISSING_TOKEN: 'missing_token',
  },
  VALIDATION: {
    MISSING_FIELD: 'missing_credentials',
    WEAK_PASSWORD: 'weak_password',
    INVALID_FORMAT: 'invalid_format',
  },
  CONFLICT: {
    EMAIL_EXISTS: 'email_already_exists',
    USERNAME_TAKEN: 'username_taken',
  },
  NETWORK: {
    TIMEOUT: 'connection_timeout',
    DNS_FAILED: 'dns_lookup_failed',
    CIRCUIT_OPEN: 'circuit_breaker_open',
    UPSTREAM_ERROR: 'upstream_service_error',
  }
} as const;

export const DATA_ERROR = {
    DUPLICATE: 'duplicate_entry',
    NOT_FOUND: 'not_found',
    CONNECTION_FAIL: 'connection_fail',
    CONSTRAINT_VIOLATION: 'constraint_violation',
    INTERNAL_ERROR: 'internal_error'
}