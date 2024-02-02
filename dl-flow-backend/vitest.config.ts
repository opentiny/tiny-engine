import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
    test: {
        alias: {
            '~': resolve(__dirname, './src'),
            '~db': resolve(__dirname, './src/db'),
        },
    },
    define: {
        '__DEV__': true,
        '__TEST__': true
    }
});
