import type { RouteRecordRaw } from 'vue-router'
export interface PageRendererProps {
  pageId: string
}

export type IRouteConfig = RouteRecordRaw

export interface StoreConfig {
  id: string
  state: Record<string, any>
  actions: Record<string, any>
  getters: Record<string, any>
}
