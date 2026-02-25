import {
  ERROR_CODES,
  ErrorDetail,
  FrontendError,
  HTTP_STATUS,
  LOG_REASONS,
  UserDTO,
  UserLoginDTO,
  UserLoginSchema,
  usernameDTO,
  UserRegisterDTO,
  UserRegisterSchema,
  FrontendReasonValue,
} from '@transcendence/core';
import api from './api-client';
import i18next from 'i18next';

export const authApi = {
  register: async (payload: UserRegisterDTO): Promise<usernameDTO> => {
    const validation = UserRegisterSchema.safeParse(payload);
    if (!validation.success) {
      const details: ErrorDetail[] = validation.error.issues.map((issue) => ({
        field: issue.path[0]?.toString() || 'form',
        message: issue.message,
        reason: (issue?.code as FrontendReasonValue) || LOG_REASONS.UNKNOWN,
      }));
      throw new FrontendError(
        i18next.t(`errors.${ERROR_CODES.VALIDATION_ERROR}`),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        details,
      );
    }
    const { data } = await api.post(`/auth/register`, payload);
    return data.user?.username;
  },

  login: async (payload: UserLoginDTO): Promise<usernameDTO> => {
    const validation = UserLoginSchema.safeParse(payload);
    if (!validation.success) {
      const details: ErrorDetail[] = validation.error.issues.map((issue) => ({
        field: issue.path[0]?.toString() || 'form',
        message: issue.message,
        reason: (issue?.code as FrontendReasonValue) || LOG_REASONS.UNKNOWN,
      }));
      throw new FrontendError(
        i18next.t(`errors.${ERROR_CODES.VALIDATION_ERROR}`),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        details,
      );
    }
    const { data } = await api.post(`/auth/login`, payload);
    return data?.user?.username;
  },

  me: async (): Promise<UserDTO> => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Échange un code d'autorisation OAuth contre un JWT
   * @param provider Provider OAuth ('google' | 'school42')
   * @param request Code d'autorisation et state
   * @returns Informations de connexion OAuth
   */
  oauthCallback: async (
    provider: 'google' | 'school42',
    request: { code: string; state?: string },
  ): Promise<{
    message: string;
    username: string;
    provider: string;
    isNewUser: boolean;
  }> => {
    const { data } = await api.post(`/auth/oauth/${provider}/callback`, {
      code: request.code,
      state: request.state,
    });

    const result = data?.result;
    const username = result?.username;

    if (!username) {
      const details: ErrorDetail[] = [
        {
          field: 'username',
          message: 'Missing username in OAuth callback response',
          reason: LOG_REASONS.UNKNOWN,
        },
      ];
      throw new FrontendError(
        i18next.t(`errors.${ERROR_CODES.INVALID_CREDENTIALS}`),
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INVALID_CREDENTIALS,
        details,
      );
    }

    return {
      message: result?.message || 'OAuth login successful',
      username,
      provider: result?.provider || provider,
      isNewUser: result?.isNewUser || false,
    };
  },
};
