import CanvasContainer from './src/CanvasContainer.vue'
import { useMultiSelect } from './src/composables/useMultiSelect'
import { registerHotkeyEvent, removeHotkeyEvent } from './src/keyboard'
import metaData from './meta'

export default {
  ...metaData,
  entry: CanvasContainer,
  api: { useMultiSelect, registerHotkeyEvent, removeHotkeyEvent }
}
