const { exec } = require('node:child_process')

exec('pnpm -F @opentiny/vite-plugin-generate-comments -F @opentiny/tiny-engine-controller -F @opentiny/tiny-engine-dsl-vue build')
