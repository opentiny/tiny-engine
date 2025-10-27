import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useRobot from './useRobot'

export const RobotService = {
  id: 'engine.service.robot',
  type: 'MetaService',
  apis: useRobot(),
  composable: {
    name: HOOK_NAME.useRobot
  }
}
