import CanvasContainer from './src/CanvasContainer.vue'
import { useSelectNode } from './src/interactions'
import { registerHotkeyEvent, removeHotkeyEvent } from './src/keyboard'
import metaData from './meta'

export default {
  ...metaData,
  entry: CanvasContainer,
  api: { useSelectNode, registerHotkeyEvent, removeHotkeyEvent }
}
