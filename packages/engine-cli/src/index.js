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
import { Command, Option } from 'commander'
import { input, select } from '@inquirer/prompts'
import { createPlatform, createPlugin, createTheme } from './commands/create.js'

const program = new Command()

const messageMap = {
  theme: {
    message:
      'Please enter the theme ID (used to uniquely identify the theme in code or configuration, such as "custom"). 请输入主题ID（用于代码或配置中唯一标识该主题，如“custom”）',
    validateMessage: 'theme ID can not be empty. 主题ID不允许为空。'
  },
  project: {
    message: 'please enter the project name. 请输入项目名称',
    validateMessage: 'project name can not be empty. 项目名称不允许为空。'
  }
}

const getName = async (type) => {
  return await input({
    message: type ? messageMap.theme.message : messageMap.project.message,
    validate: (inputName) => {
      if (!inputName) {
        return type ? messageMap.theme.validateMessage : messageMap.project.validateMessage
      }

      return true
    }
  })
}

program
  .command('create-platform <name>')
  .description('create a new tiny-engine platform 创建一个新的tiny-engine低代码平台')
  .addOption(new Option('-t, --theme <theme>', 'platform theme 平台主题', 'light').choices(['light', 'dark']))
  .option('-pid, --platformId <platformId>', 'platform id 平台主题', 1)
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
  .command('create-theme <name>')
  .description('create a new tiny-engine theme 创建一个新的 tiny-engine 主题')
  .action(async (name) => {
    const themeName = await getName('theme')
    createTheme(name, themeName)
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
        },
        {
          name: 'theme',
          value: 'theme',
          description: 'create a new tiny-engine theme 创建一个新的 tiny-engine 主题'
        }
      ]
    })

    const projectName = await getName()

    const typeMapper = {
      platform: createPlatform,
      plugin: createPlugin,
      theme: createTheme
    }

    const themeName = type === 'theme' ? await getName(type) : ''

    typeMapper[type](projectName, themeName)
  })

program.parse(process.argv)
