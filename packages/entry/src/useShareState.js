import { reactive, ref } from 'vue'

const shareState = reactive({})

export const useShareState = (key) => {
  return [
    ref(shareState[key]),
    (value) => {
      shareState[key] = value
    }
  ]
}
