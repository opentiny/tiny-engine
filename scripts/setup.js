const { exec } = require('child_process')

exec('pnpm -F @opentiny/tiny-engine-controller -F @opentiny/tiny-engine-dsl-vue build')
