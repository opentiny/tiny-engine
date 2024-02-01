// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['./src/app.ts'],
  bundle: true,
  tsconfig: 'tsconfig.json',
  define: {
    'process.env.NODE_ENV': '"prod"'
  },
  outdir: 'dist',
  platform: 'node',
  logLevel: 'info',
  external: ['./node_modules/*']
});