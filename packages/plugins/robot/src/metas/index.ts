import { defineService } from '@opentiny/tiny-engine-meta-register'
import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useConfig, { init } from '../composables/core/useConfig'

export const RobotService = defineService({
  id: 'engine.service.robot',
  type: 'MetaService',
  init,
  apis: useConfig(),
  composable: {
    name: HOOK_NAME.useRobot
  }
})
