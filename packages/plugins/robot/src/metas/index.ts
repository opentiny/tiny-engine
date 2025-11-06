import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useModelConfig from '../composables/useConfig'

export const RobotService = {
  id: 'engine.service.robot',
  type: 'MetaService',
  apis: {
    robotSettingState: useModelConfig().robotSettingState,
    getAIModelOptions: useModelConfig().getAIModelOptions
  },
  composable: {
    name: HOOK_NAME.useRobot
  }
}
