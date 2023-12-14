const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

fs.access(path.resolve(__dirname, 'packages/vue-generator/dist'), (err) => {
  if (err) {
    exec('pnpm -F @opentiny/tiny-engine-dsl-vue build')
  }
})
