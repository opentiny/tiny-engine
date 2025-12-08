import { getOptions } from '@opentiny/tiny-engine-meta-register'
import meta from '../../meta'

export const getRobotServiceOptions = () => {
  return getOptions(meta.id)
}
