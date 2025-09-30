import type { RouteLocationRaw } from 'vue-router'

export interface PageRendererProps {
  pageId: number
}

export interface RouteConfig {
  path: string
  name: string
  children?: RouteConfig[]
  props?: PageRendererProps
  redirect?: RouteLocationRaw
  meta: {
    pageId: number
    pageName: string
    hasChildren: boolean
    isHome: boolean
    depth: number
    isDefault: boolean
    hasDefault: boolean
    defaultPath: string
  }
}

export interface StoreConfig {
  id: string
  state: Record<string, any>
  actions: Record<string, any>
  getters: Record<string, any>
}
