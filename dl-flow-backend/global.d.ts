declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DB_URL: string
        }
    }
    declare const __DEV__:boolean;
    declare const __TEST__: boolean;
}

export {}