import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
const { BROADCAST_CHANNEL } = constants
const { post } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

// 此处向外层window传递notify配置参数
export const globalNotify = (options) => post(options)
