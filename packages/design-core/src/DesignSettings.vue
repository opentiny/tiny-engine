<template>
  <component
    v-if="SettingsPanel"
    :is="SettingsPanel"
    v-show="layoutState.settings.showDesignSettings"
    v-model="layoutState.settings.render"
    :activated="layoutState.settings.activating"
    ref="right"
  ></component>
</template>

<script>
import { useLayout } from '@opentiny/tiny-engine-controller'
import { getMergeMeta } from '@opentiny/tiny-engine-entry'

export default {
  setup() {
    const SettingsPanel = getMergeMeta('engine.settings')?.component

    const { layoutState } = useLayout()

    return { SettingsPanel, layoutState }
  }
}
</script>
