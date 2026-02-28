import { LOG_EVENTS, LOG_REASONS } from '../logging/logging.js';
import { AppError, ErrorDetail, FrontendError, FrontendReasonValue } from './error-types.js';
import { HTTP_STATUS } from '../constants/index.js';
import { ERROR_CODES } from './error-codes.js';
import { ErrorLogPayload } from '../logging/logging-types.js';
import z from 'zod';

export interface FastifyValidationError {
  code: string;
  message?: string;
  validation?: ZodIssue[];
}

type ZodIssue = z.core.$ZodIssue;

interface MinimalRequest {
  id?: string;
  method?: string;
  url?: string;
  user?: { id?: number | string; name?: string; role?: string };
}

interface MinimalFastifyError {
  code?: string;
  name?: string;
  message?: string;
  statusCode?: number;
  cause?: unknown;
  stack?: string;
}

const PUBLIC_REASONS: string[] = [
  LOG_REASONS.SECURITY.TOKEN_EXPIRED,
  LOG_REASONS.SECURITY.RATE_LIMIT_REACHED,
  ...Object.values(LOG_REASONS.VALIDATION),
  ...Object.values(LOG_REASONS.CONFLICT),
  LOG_REASONS.UNKNOWN,
];

const isFrontendReason = (reason: string): reason is FrontendReasonValue => {
  return PUBLIC_REASONS.includes(reason);
};

export const zodIssueToErrorDetail = (issue: ZodIssue): ErrorDetail => {
  const detail: ErrorDetail = {
    reason: issue.code as FrontendReasonValue,
    field: issue.path?.join('.') || 'unknown',
    message: issue.message,
  };
  if (issue.code === 'invalid_type') {
    detail.expected = (issue as z.core.$ZodIssueInvalidType).expected;
  }
  if (issue.code === 'invalid_format') {
    detail.expected = (issue as z.core.$ZodIssueInvalidStringFormat).format;
  }
  return detail;
};

export const fastifyValidationErrorToFrontend = (error: FastifyValidationError): FrontendError => {
  const details: ErrorDetail[] = error.validation?.map(zodIssueToErrorDetail) ?? [
    {
      reason: LOG_REASONS.UNKNOWN as FrontendReasonValue,
      field: 'unknown',
      message: error.message,
    },
  ];

  return new FrontendError(
    'Validation failed',
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR,
    details,
  );
};

export const appErrorToFrontend = (error: AppError): FrontendError => {
  const reason = error?.context?.reason ?? LOG_REASONS.UNKNOWN;
  const safeReason: FrontendReasonValue = isFrontendReason(reason) ? reason : LOG_REASONS.UNKNOWN;
  let details: ErrorDetail[] | null = null;
  if (error.context?.zodIssues?.length) {
    details = error.context.zodIssues.map((issue) => zodIssueToErrorDetail(issue));
  } else if (Array.isArray(error.context?.details) && error.context.details.length) {
    details = error.context.details.map((d) => ({
      reason: safeReason,
      field: d?.field ?? 'unknown',
    }));
  } else if (error.context?.field || isFrontendReason(reason)) {
    details = [
      {
        reason: safeReason,
        field: error.context?.field as string | undefined,
      },
    ];
  }
  return new FrontendError(error.message, error.statusCode, error.code, details);
};

export const appErrorToLog = (error: AppError, req: MinimalRequest): ErrorLogPayload => {
  const frontend = appErrorToFrontend(error);
  const firstReason = frontend.details?.[0]?.reason ?? LOG_REASONS.UNKNOWN;
  return {
    event: LOG_EVENTS.APPLICATION.HANDLED_ERROR,
    reason: isFrontendReason(firstReason) ? firstReason : LOG_REASONS.UNKNOWN,
    request: {
      requestId: req.id,
      method: req.method,
      url: req.url,
      user: {
        id: req.user?.id,
        name: req.user?.name,
        role: req.user?.role,
      },
    },
    error: {
      errorCode: error.code,
      errorName: error.name,
      statusCode: error.statusCode ? String(error.statusCode) : undefined,
      cause: error.cause,
      stack: error.stack,
    },
  };
};

export const fastifyValidationErrorToLog = (
  error: MinimalFastifyError & { validation?: ZodIssue[] },
  req: MinimalRequest,
): ErrorLogPayload => {
  const frontend = fastifyValidationErrorToFrontend(error as FastifyValidationError);
  const firstReason = frontend.details?.[0]?.reason ?? LOG_REASONS.UNKNOWN;
  return {
    event: LOG_EVENTS.APPLICATION.VALIDATION_FAIL,
    reason: isFrontendReason(firstReason) ? firstReason : LOG_REASONS.UNKNOWN,
    request: {
      requestId: req.id,
      method: req.method,
      url: req.url,
      user: {
        id: req.user?.id,
        name: req.user?.name,
        role: req.user?.role,
      },
    },
    error: {
      errorCode: error.code,
      errorName: error.name,
      statusCode: error.statusCode ? String(error.statusCode) : undefined,
      cause: error.cause,
      stack: error.stack,
    },
  };
};

export const panicErrorToLog = (
  error: MinimalFastifyError,
  req: MinimalRequest,
): ErrorLogPayload => ({
  event: LOG_EVENTS.CRITICAL.PANIC,
  reason: LOG_REASONS.UNKNOWN,
  request: {
    requestId: req.id,
    method: req.method,
    url: req.url,
    user: {
      id: req.user?.id,
      name: req.user?.name,
      role: req.user?.role,
    },
  },
  error: { errorCode: error.code, errorName: error.name, stack: error.stack },
});

export const fastifyErrorToReplyPayload = (error: FastifyValidationError) => {
  const frontend = fastifyValidationErrorToFrontend(error);

  return {
    status: frontend.statusCode,
    body: {
      statusCode: frontend.statusCode,
      errorCode: error.code,
      message: frontend.message,
      details: frontend.details,
    },
  };
};

export const appErrorToReplyPayload = (error: AppError) => {
  const frontend = appErrorToFrontend(error);

  return {
    status: frontend.statusCode,
    body: {
      statusCode: frontend.statusCode,
      errorCode: error.code,
      message: frontend.message,
      details: frontend.details,
    },
  };
};

export const rateLimitErrorToLog = (
  error: MinimalFastifyError,
  req: MinimalRequest,
  retryAfterSeconds: number,
): ErrorLogPayload => ({
  event: LOG_EVENTS.APPLICATION.RATE_LIMIT,
  reason: LOG_REASONS.SECURITY.RATE_LIMIT_REACHED,
  request: { requestId: req.id, method: req.method, url: req.url },
  error: {
    errorCode: error.code,
    errorName: error.name,
    statusCode: '429',
    retryAfter: `${retryAfterSeconds}s`,
  },
});

export const rateLimitErrorToReplyPayload = (retryAfterSeconds: number) => {
  const timeUnit = retryAfterSeconds === 1 ? 'second' : 'seconds';
  return {
    status: 429,
    body: {
      statusCode: 429,
      errorCode: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: `Too many requests, please try again in ${retryAfterSeconds} ${timeUnit}`,
      details: [
        { reason: LOG_REASONS.SECURITY.RATE_LIMIT_REACHED, retryAfter: `${retryAfterSeconds}s` },
      ],
    },
  };
};

export const replySentToLog = (
  error: MinimalFastifyError,
  req: MinimalRequest,
): ErrorLogPayload => ({
  event: LOG_EVENTS.LIFECYCLE.REPLY_SENT_SKIP,
  reason: LOG_REASONS.UNKNOWN,
  request: { requestId: req.id, method: req.method, url: req.url },
  error: { errorCode: error.code, errorName: error.name },
});
