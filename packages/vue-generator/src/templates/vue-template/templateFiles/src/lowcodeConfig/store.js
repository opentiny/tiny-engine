import * as useDefinedStores from '@/stores'

const useStores = () => {
  const stores = {}

  Object.values({ ...useDefinedStores }).forEach((store) => {
    stores[store.$id] = store().$state
  })

  return stores
}

export { useStores }
