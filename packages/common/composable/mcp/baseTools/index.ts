import type { IState, ToolItem } from '../type'
import { createDiscoverResourcesTool } from './discoverResources'
import { createReadResourcesTool } from './readResources'
import { createSearchResourcesTool } from './searchResources'

export const getBaseTools = (state: IState): ToolItem[] => [
  createDiscoverResourcesTool(state),
  createReadResourcesTool(state),
  createSearchResourcesTool(state)
]

export default { getBaseTools }
