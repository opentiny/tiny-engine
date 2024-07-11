/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { Command, Option } from 'commander'
import { input, select } from '@inquirer/prompts'
import { createPlatform, createPlugin } from './commands/create.js'

const program = new Command()

program
  .command('create-platform <name>')
  .description('create a new tiny-engine platform 创建一个新的tiny-engine低代码平台')
  .addOption(new Option('-t, --theme <theme>', 'platform theme 平台主题', 'light').choices(['light', 'dark']))
  .option('-pid, --platformId <platformId>', 'platform id 平台主题', 918)
  .option('-m, --material [material...]', 'material address 物料地址', ['/mock/bundle.json'])
  .option('--scripts [script...]', '物料 script', [])
  .option('--styles [styles...]', '物料 styles', [])
  .action((name, options) => {
    createPlatform(name, options)
  })

program
  .command('create-plugin <name>')
  .description('create a new tiny-engine plugin 创建一个新的 tiny-engine 插件')
  .action((name) => {
    createPlugin(name)
  })

program
  .command('create')
  .description('create a new tiny-engine platform or plugin by prompt 根据提示创建一个新的 tiny-engine 插件')
  .action(async () => {
    const type = await select({
      message: 'select create type 选择创建类型',
      choices: [
        {
          name: 'platform',
          value: 'platform',
          description: 'create a new tiny-engine platform 创建一个新的 tiny-engine 低代码平台'
        },
        {
          name: 'plugin',
          value: 'plugin',
          description: 'create a new tiny-engine plugin 创建一个新的 tiny-engine 插件'
        }
      ]
    })

    const projectName = await input({
      message: 'please enter the project name. 请输入项目名称',
      validate: (inputName) => {
        if (!inputName) {
          return 'project name can not be empty. 项目名称不允许为空。'
        }

        return true
      }
    })

    const typeMapper = {
      platform: createPlatform,
      plugin: createPlugin
    }

    typeMapper[type](projectName)
  })

program.parse(process.argv)
