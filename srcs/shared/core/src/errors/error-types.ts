import { HTTP_STATUS } from '../constants/index.js';
import { EventValue, LogContext, ReasonValue, ZodIssueCodes } from '../logging/logging-types.js';
import { LOG_REASONS } from '../logging/logging.js';
import { ERROR_CODES } from './error-codes.js';

export type DeepValues<T> = T extends object ? { [K in keyof T]: DeepValues<T[K]> }[keyof T] : T;

type SecurityFrontReasons =
  | typeof LOG_REASONS.SECURITY.TOKEN_EXPIRED
  | typeof LOG_REASONS.SECURITY.RATE_LIMIT_REACHED;

type ValidationReasons = DeepValues<typeof LOG_REASONS.VALIDATION>;
type ConflictReasons = DeepValues<typeof LOG_REASONS.CONFLICT>;
type TournamentReasons = DeepValues<typeof LOG_REASONS.TOURNAMENT>;

export type FrontendReasonValue =
  | SecurityFrontReasons
  | ValidationReasons
  | ConflictReasons
  | ZodIssueCodes
  | TournamentReasons
  | typeof LOG_REASONS.UNKNOWN;

export type HttpStatus = DeepValues<typeof HTTP_STATUS>;

export type ErrorCode = DeepValues<typeof ERROR_CODES>;

// interface for quick error generation through error catalog
export interface ErrorDefinition {
  code: ErrorCode;
  statusCode?: HttpStatus;
  message: string;
  event: EventValue;
  reason: ReasonValue;
}

// attribute which will be propagated till client
export interface ErrorDetail {
  reason: FrontendReasonValue;
  field?: string;
  message?: string;
  expected?: string;
  received?: string;
}
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly context: LogContext;
  constructor(
    definition: ErrorDefinition,
    dynamicContext: Omit<LogContext, 'event' | 'reason'> = {},
    cause?: unknown,
  ) {
    super(definition.message, { cause });
    this.name = 'AppError';
    this.code = definition.code;
    this.statusCode = definition.statusCode || 500;
    this.context = {
      event: definition.event,
      reason: definition.reason,
      ...dynamicContext,
    } as LogContext;
    if ('captureStackTrace' in Error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      (Error as { captureStackTrace: Function }).captureStackTrace(this, this.constructor);
    }
  }
}

export class FrontendError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly details: ErrorDetail[] | null;
  constructor(
    message: string,
    statusCode: HttpStatus,
    code: ErrorCode,
    details: ErrorDetail[] | null,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
