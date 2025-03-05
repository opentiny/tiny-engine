/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

const gulp = require('gulp')
const eslint = require('gulp-eslint')
const nodemon = require('gulp-nodemon')
const friendlyFormatter = require('eslint-friendly-formatter')

let jsScript = 'node'
if (process.env.npm_config_argv !== undefined && process.env.npm_config_argv.indexOf('debug') > 0) {
  jsScript = 'node debug'
}

function lintOne(aims) {
  return gulp
    .src(aims)
    .pipe(eslint({ configFile: './.eslintrc.js' }))
    .pipe(eslint.format(friendlyFormatter))
    .pipe(
      eslint.results((results) => {
        // Called once for all ESLint results.
      })
    )
}

gulp.task('ESlint', () => {
  return gulp
    .src(['src/**/*.js', '!node_modules/**'])
    .pipe(eslint({ configFile: './.eslintrc.js' }))
    .pipe(eslint.format(friendlyFormatter))
    .pipe(eslint.results((results) => {}))
})

gulp.task(
  'ESlint_nodemon',
  gulp.series('ESlint', () => {
    const stream = nodemon({
      script: 'build/dev-server.js',
      execMap: {
        js: jsScript
      },
      tasks: function (changedFiles) {
        lintOne(changedFiles)
        return []
      },
      verbose: true,
      ignore: ['build/*.js', 'dist/*.js', 'nodemon.json', '.git', 'node_modules/**/node_modules', 'gulpfile.js'],
      env: {
        NODE_ENV: 'development'
      },
      ext: 'js json'
    })

    return stream
      .on('restart', () => {
        // 重启项目
      })
      .on('crash', () => {
        // 重启工程：restart the server in 20 seconds：stream.emit('restart', 20)
      })
  })
)

gulp.task('nodemon', () => {
  return nodemon({
    script: 'build/dev-server.js',
    execMap: {
      js: jsScript
    },
    verbose: true,
    ignore: ['build/*.js', 'dist/*.js', 'nodemon.json', '.git', 'node_modules/**/node_modules', 'gulpfile.js'],
    env: {
      NODE_ENV: 'development'
    },
    ext: 'js json'
  })
})

gulp.task('default', () => {
  const stream = nodemon({
    script: 'build/dev-server.js',
    execMap: {
      js: jsScript
    },
    verbose: true,
    ignore: ['build/*.js', 'dist/*.js', 'nodemon.json', '.git', 'node_modules/**/node_modules', 'gulpfile.js'],
    env: {
      NODE_ENV: 'development'
    },
    ext: 'js json'
  })

  return stream
    .on('restart', () => {
      // 重启项目
    })
    .on('crash', () => {
      // 重启工程：restart the server in 20 seconds：stream.emit('restart', 20)
    })
})
