declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'dev' | 'prod',
        DB_URL: string;
    }
}
declare const __DEV__: boolean;
declare const __TEST__: boolean;