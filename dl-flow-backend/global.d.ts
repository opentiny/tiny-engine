import { JwtSignOptions } from '@nestjs/jwt';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_DB: number;
      REDIS_PASSWORD: string;
      JWT_EXPIRE_IN: string;
      JWT_SIGN_ALGORITHM: JwtSignOptions['algorithm'];
      JWT_PUB_KEY: string;
      JWT_PRI_KEY: string;
      /**
       * @deprecated
       */
      PWD_SALT: string; // used for bcrypt
      PWD_SALT_LEN: string;
    }
  }
  declare const __DEV__: boolean;
  declare const __TEST__: boolean;
}

export {};
