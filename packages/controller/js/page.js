import { PAGE_STATUS } from './constants'
import useEditorInfo from '../src/useEditorInfo'

export const getPageStatus = (data, isDemo = false) => {
  const { resetPasswordToken } = useEditorInfo().userInfo

  if (isDemo && [PAGE_STATUS.Developer, PAGE_STATUS.SuperAdmin].includes(resetPasswordToken)) {
    isDemo = false
  }

  let state = ''

  if (isDemo) {
    state = PAGE_STATUS.Guest
  } else if (!data) {
    state = PAGE_STATUS.Release
  } else {
    state = useEditorInfo().userInfo.id === data.id ? PAGE_STATUS.Occupy : PAGE_STATUS.Lock
  }

  return {
    state,
    data
  }
}
