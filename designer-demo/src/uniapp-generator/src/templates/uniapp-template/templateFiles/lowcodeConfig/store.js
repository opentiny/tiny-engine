import * as useDefinedStores from '@/stores'

const useStores = () => {
  const stores = {}

  Object.values({ ...useDefinedStores }).forEach((store) => {
    stores[store.$id] = store()
  })

  return stores
}

export { useStores }
