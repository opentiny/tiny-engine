import CanvasContainer from './src/CanvasContainer.vue'
import metaData from './meta'
import api from './src/api'
export default {
  ...metaData,
  entry: CanvasContainer,
  apis: api()
}
