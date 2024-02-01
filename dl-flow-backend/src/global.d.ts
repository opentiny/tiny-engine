declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'dev' | 'prod',
        DB_URL: string;
    }
}