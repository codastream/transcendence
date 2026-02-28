import { UserPayload } from './types.js';

export interface JWTApp {
  jwt: {
    verify: (token: string) => UserPayload;
  };
}
