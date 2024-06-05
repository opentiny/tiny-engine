import component from './src/Main.vue'
import metaData from './meta'
import { fetchGroups } from './src/http'

export default {
  ...metaData,
  component,
  apis: {
    fetchGroups
  },
  options: {
    title: '区块'
  }
}
