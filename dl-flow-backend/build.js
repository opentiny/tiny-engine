// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['./src/server.ts'],
  bundle: true,
  tsconfig: 'tsconfig.json',
  define: {
    'process.env.NODE_ENV': '"prod"',
    __TEST__: '""'
  },
  outdir: 'dist',
  platform: 'node',
  logLevel: 'info',
  external: ['./node_modules/*'],
  treeShaking: true,
  minify: true,
  minifyIdentifiers: false,
  minifyWhitespace: false
});