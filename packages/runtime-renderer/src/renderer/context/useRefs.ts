import { shallowReactive } from 'vue'
export function useRefs() {
  const refsMap = shallowReactive<Record<string, any>>({})
  return {
    $: (refName: string) => refsMap[refName],
    $ref: (refName: string, value: any) => {
      refsMap[refName] = value
    }
  }
}
