import type { IState, ToolItem } from '../type'
import { createDiscoverResourcesTool } from './discoverResources'
import { createReadResourcesTool } from './readResources'
import { createSearchResourcesTool } from './searchResources'
import { sequentialThinking } from './sequentialThinking'

export const getBaseTools = (state: IState): ToolItem[] => [
  createDiscoverResourcesTool(state),
  createReadResourcesTool(state),
  createSearchResourcesTool(state),
  sequentialThinking
]

export default { getBaseTools }
