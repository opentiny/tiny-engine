import entry from './src/Main.vue'
import metaData from './meta'
import { fetchGroups, fetchGroupBlocksByIds } from './src/http'

export default {
  ...metaData,
  entry,
  apis: {
    fetchGroups,
    fetchGroupBlocksByIds
  },
  options: {
    title: '区块'
  }
}
