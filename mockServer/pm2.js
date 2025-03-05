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

module.exports = {
  apps: [
    {
      name: 'RESRful API Server',
      script: './dist/app.js',
      watch: false, // 默认关闭watch 可替换为 ['src']
      ignoreWatch: ['node_modules', 'build', 'logs'],
      outFile: '/logs/out.log', // 日志输出
      errorFile: '/logs/error.log', // 错误日志
      maxMemoryRestart: '2G', // 超过多大内存自动重启，仅防止内存泄露有意义，需要根据自己的业务设置
      env: {
        NODE_ENV: 'production'
      },
      execMode: 'cluster', // 开启多线程模式，用于负载均衡
      instances: 'max', // 启用多少个实例，可用于负载均衡
      autorestart: true // 程序崩溃后自动重启
    }
  ]
}
