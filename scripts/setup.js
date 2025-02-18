const { exec } = require('node:child_process')

exec(
  'pnpm -F @opentiny/tiny-engine-vite-plugin-meta-comments -F @opentiny/tiny-engine-common -F @opentiny/tiny-engine-dsl-vue build'
)
