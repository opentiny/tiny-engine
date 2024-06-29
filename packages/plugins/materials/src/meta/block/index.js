import entry from './src/Main.vue'
import metaData from './meta'
import { fetchGroups } from './src/http'

export default {
  ...metaData,
  entry,
  apis: {
    fetchGroups
  },
  options: {
    title: '区块'
  }
}
