// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fork } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { watch } = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path');
const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};
(async function() {
    const option = {
        entryPoints: ['./src/**/*.ts'],
        outdir: 'dist',
        platform: 'node',
        external: ['./node_modules/*'],
        sourcemap: 'external',
        bundle: true,
        define: {
            __TEST__: '""',
            __DEV__: '"true"'
        }
    };
    esbuild.buildSync(option);
    const ctx = esbuild.context(option);

    /**
     * @type {import('child_process').ChildProcess}
     */
    let child;
    const f = debounce((ev, fileName) => {
        console.log(fileName, ev);
        if (child) {
            child.kill();
        }
        console.clear();
        child = fork('./dist/server.js');
    }, 1000);
    (await ctx).watch();
    watch(join(__dirname, 'dist'), f);
})();