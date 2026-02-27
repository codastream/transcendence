import { ERROR_CODES } from '@transcendence/core';

/**
 * Mapping centralisé : code d'erreur backend → clé de traduction i18n
 *
 * Garantit un rendu lisible et traduit pour tous les codes retournés par le
 * service auth. Utiliser `mapErrorToI18nKey` dans les composants plutôt
 * qu'interpoler les codes directement.
 */
export const AUTH_ERROR_I18N: Readonly<Record<string, string>> = {
  [ERROR_CODES.INVALID_CREDENTIALS]: `errors.${ERROR_CODES.INVALID_CREDENTIALS}`,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: `errors.${ERROR_CODES.RATE_LIMIT_EXCEEDED}`,
  [ERROR_CODES.VALIDATION_ERROR]: `errors.${ERROR_CODES.VALIDATION_ERROR}`,
  [ERROR_CODES.VALIDATION_MANDATORY]: `errors.${ERROR_CODES.VALIDATION_MANDATORY}`,
  [ERROR_CODES.INVALID_2FA_CODE]: `errors.${ERROR_CODES.INVALID_2FA_CODE}`,
  [ERROR_CODES.INVALID_CODE_FORMAT]: `errors.${ERROR_CODES.INVALID_CODE_FORMAT}`,
  [ERROR_CODES.LOGIN_SESSION_EXPIRED]: `errors.${ERROR_CODES.LOGIN_SESSION_EXPIRED}`,
  [ERROR_CODES.TOO_MANY_ATTEMPTS]: `errors.${ERROR_CODES.TOO_MANY_ATTEMPTS}`,
  [ERROR_CODES.MISSING_PARAMETERS]: `errors.${ERROR_CODES.INVALID_CODE_FORMAT}`,
  [ERROR_CODES.UNAUTHORIZED]: `errors.${ERROR_CODES.UNAUTHORIZED}`,
  [ERROR_CODES.FORBIDDEN]: `errors.${ERROR_CODES.FORBIDDEN}`,
  [ERROR_CODES.CONFLICT]: `errors.${ERROR_CODES.CONFLICT}`,
  [ERROR_CODES.NOT_FOUND]: `errors.${ERROR_CODES.NOT_FOUND}`,
  [ERROR_CODES.INTERNAL_ERROR]: `errors.${ERROR_CODES.INTERNAL_ERROR}`,
} as const;

/**
 * Retourne la clé i18n correspondant au code d'erreur backend.
 * Fallback sur internal_error si le code est inconnu.
 */
export const mapErrorToI18nKey = (code: string): string =>
  AUTH_ERROR_I18N[code] ?? `errors.${ERROR_CODES.INTERNAL_ERROR}`;
