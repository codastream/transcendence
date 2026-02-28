import z from 'zod';
import { DeepValues } from '../errors/error-types.js';
import { LOG_EVENTS, LOG_REASONS } from './logging.js';

export type EventValue = DeepValues<typeof LOG_EVENTS>;

export interface LogDetail {
  resource?: string;
  field?: string;
  value?: string | number;
  expected?: string;
  extraInfo?: string;
}

export type ZodIssueCodes = z.core.$ZodIssue['code'];

export type ReasonValue = DeepValues<typeof LOG_REASONS> | ZodIssueCodes;

export interface LogContext {
  event: EventValue;
  reason?: ReasonValue;
  userId?: number | string;
  details?: LogDetail[];
  zodIssues?: z.core.$ZodIssue[];
  originalError?: unknown;
  field?: string;
}

export interface RequestContext {
  requestId?: string;
  method?: string;
  url?: string;
  user?: {
    id?: number | string;
    name?: string;
    role?: string;
  };
}

export interface ErrorContext {
  errorCode?: string;
  errorName?: string;
  statusCode?: string;
  cause?: unknown;
  stack?: string;
  retryAfter?: string;
}

export interface ErrorLogPayload {
  event: EventValue;
  reason: ReasonValue;
  request: RequestContext;
  error: ErrorContext;
}
