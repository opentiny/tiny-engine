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
import { createPlatform, createPlugin, createConfigurator } from './commands/create.js'

const program = new Command()

program
  .command('create-platform <name>')
  .description('create a new tiny-engine platform 创建一个新的tiny-engine低代码平台')
  .addOption(new Option('-t, --theme <theme>', 'platform theme 平台主题').choices(['light', 'dark']).default('light'))
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
  .addOption(new Option('-t, --type <type>', '插件类型').choices(['plugins', 'toolbars']).default('plugins'))
  .addOption(new Option('-a, --align <align>', '插件对其位置').choices(['top', 'bottom', 'left', 'center', 'right']))
  .action((name, options) => {
    if (!options.align) {
      options.align = options.type === 'plugins' ? 'top' : 'left'
    }

    createPlugin(name, options)
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
          name: 'configurator',
          value: 'configurator',
          description: 'create a new tiny-engine configurator 创建一个新的 tiny-engine 属性面板设置器'
        }
      ]
    })

    const nameDesc = {
      platform: '项目',
      plugin: '插件',
      configurator: '设置器'
    }

    const projectName = await input({
      message: `please enter name. 请输入${nameDesc[type]}名称`,
      validate: (inputName) => {
        if (!inputName) {
          return `name can not be empty. ${nameDesc[type]}名称不允许为空。`
        }

        return true
      }
    })

    const options = {}

    if (type === 'platform') {
      const theme = await select({
        message: 'select theme type 选择主题类型',
        choices: [
          {
            name: 'light',
            value: 'light'
          },
          {
            name: 'dark',
            value: 'dark'
          }
        ]
      })

      Object.assign(options, { theme })
    } else if (type === 'plugin') {
      const pluginType = await select({
        message: 'select the plugin type. 请选择插件类型',
        choices: [
          {
            name: 'plugins',
            value: 'plugins',
            description: 'create a sidebar plugin 创建一个侧边栏插件'
          },
          {
            name: 'toolbars',
            value: 'toolbars',
            description: 'create a toolbar plugin 创建一个工具栏插件'
          }
        ]
      })

      const alignMap = {
        plugins: ['top', 'bottom'],
        toolbars: ['left', 'center', 'right']
      }

      const align = await select({
        message: 'select the align value. 请选择对齐位置',
        choices: alignMap[pluginType].map((item) => ({ name: item, value: item }))
      })

      Object.assign(options, { type: pluginType, align })
    }

    const typeMapper = {
      platform: createPlatform,
      plugin: createPlugin,
      configurator: createConfigurator
    }

    typeMapper[type](projectName, options)
  })

program.parse(process.argv)
