import { JWTPayload } from '../utils/jwt.service.js';

export interface JWTApp {
  jwt: {
    verify: (token: string) => JWTPayload;
  };
}
