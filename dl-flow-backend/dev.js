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
    let flag = false;
    return () => {
        if (timer) {
            clearTimeout(timer);
        }
        if (!flag) {
            fn();
            flag = true;
        }
        timer = setTimeout(() => {
            fn();
            flag = true;
        }, delay);
    };
};
(async function() {
    const ctx = esbuild.context({
        entryPoints: ['./src/**/*.ts'],
        outdir: 'dist',
        platform: 'node',
        external: ['./node_modules/*'],
        sourcemap: 'external',
        bundle: true,
        define: {
            __TEST__: '"false"'
        }
    });

    /**
     * @type {import('child_process').ChildProcess}
     */
    let child;
    const f = debounce(() => {
        console.log(new Date().getTime(), 'change');
        if (child) {
            child.kill();
        }
        child = fork('./dist/server.js');
    }, 1000);
    (await ctx).watch();
    watch(join(__dirname, 'dist'), f);
    console.log('watch');
})();