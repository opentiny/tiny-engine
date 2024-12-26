import { inject, watch, WritableComputedRef } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants
export function useLocale() {
  const { locale } = inject(I18nInjectionKey).global
  const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.CanvasLang })
  watch(data, () => {
    ;(locale as WritableComputedRef<unknown>).value = data.value
  })
}
