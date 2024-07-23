import { initData } from '@opentiny/tiny-engine'


export const beforeAppCreate = async () => {
  await initData()
}
