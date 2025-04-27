import type {
  NotifyParams,
  NotifyResult,
  UseBlockApi,
  UseBreadcrumbApi,
  UseCanvasApi,
  UseDataSourceApi,
  UseHelpApi,
  UseHistoryApi,
  UseLayoutApi,
  UseMaterialApi,
  UseModalApi,
  UsePageApi,
  UsePropertiesApi,
  UsePropertyApi,
  UseResourceApi,
  UseSaveLocalApi,
  UseTranslateApi
} from './types'

export const HOOK_NAME = {
  useLayout: 'layout',
  useCanvas: 'canvas',
  useResource: 'resource',
  useHistory: 'history',
  useProperties: 'properties',
  useProperty: 'property',
  useSaveLocal: 'saveLocal',
  useBlock: 'block',
  useTranslate: 'translate',
  usePage: 'page',
  useDataSource: 'dataSource',
  useBreadcrumb: 'breadcrumb',
  useHelp: 'help',
  useHttp: 'http',
  useEnv: 'env',
  useModal: 'modal',
  useNotify: 'notify',
  useCustom: 'custom',
  useMaterial: 'material',
  useStyle: 'style'
} as const

type HookName = typeof HOOK_NAME[keyof typeof HOOK_NAME]

const hooksState = {
  [HOOK_NAME.useLayout]: {},
  [HOOK_NAME.useCanvas]: {},
  [HOOK_NAME.useResource]: {},
  [HOOK_NAME.useHistory]: {},
  [HOOK_NAME.useProperties]: {},
  [HOOK_NAME.useProperty]: {},
  [HOOK_NAME.useSaveLocal]: {},
  [HOOK_NAME.useBlock]: {},
  [HOOK_NAME.useTranslate]: {},
  [HOOK_NAME.usePage]: {},
  [HOOK_NAME.useDataSource]: {},
  [HOOK_NAME.useBreadcrumb]: {},
  [HOOK_NAME.useHelp]: {},
  [HOOK_NAME.useHttp]: {},
  [HOOK_NAME.useEnv]: {},
  [HOOK_NAME.useNotify]: {},
  [HOOK_NAME.useModal]: {},
  [HOOK_NAME.useMaterial]: {},
  [HOOK_NAME.useStyle]: {},
  [HOOK_NAME.useCustom]: {} // 自定义
}

const getHook = (hookName: HookName, args: any[]) => {
  if (typeof hooksState[hookName] === 'function') {
    return hooksState[hookName](...args)
  }
  return hooksState[hookName]
}

export const useLayout = (...args: any[]): UseLayoutApi => getHook(HOOK_NAME.useLayout, args)
export const useCanvas = (...args: any[]): UseCanvasApi => getHook(HOOK_NAME.useCanvas, args)
export const useResource = (...args: any[]): UseResourceApi => getHook(HOOK_NAME.useResource, args)
export const useHistory = (...args: any[]): UseHistoryApi => getHook(HOOK_NAME.useHistory, args)
export const useProperties = (...args: any[]): UsePropertiesApi => getHook(HOOK_NAME.useProperties, args)
export const useSaveLocal = (...args: any[]): UseSaveLocalApi => getHook(HOOK_NAME.useSaveLocal, args)
export const useBlock = (...args: any[]): UseBlockApi => getHook(HOOK_NAME.useBlock, args)
export const useTranslate = (...args: any[]): UseTranslateApi => getHook(HOOK_NAME.useTranslate, args)
export const usePage = (...args: any[]): UsePageApi => getHook(HOOK_NAME.usePage, args)
export const useDataSource = (...args: any[]): UseDataSourceApi => getHook(HOOK_NAME.useDataSource, args)
export const useBreadcrumb = (...args: any[]): UseBreadcrumbApi => getHook(HOOK_NAME.useBreadcrumb, args)
export const useProperty = (...args: any[]): UsePropertyApi => getHook(HOOK_NAME.useProperty, args)
export const useHelp = (...args: any[]): UseHelpApi => getHook(HOOK_NAME.useHelp, args)
export const useHttp = (...args: any[]) => getHook(HOOK_NAME.useHttp, args)
export const useEnv = (...args: any[]): ImportMetaEnv => getHook(HOOK_NAME.useEnv, args)
export const useModal = (...args: any[]): UseModalApi => getHook(HOOK_NAME.useModal, args)
export const useNotify = (...args: NotifyParams): NotifyResult => getHook(HOOK_NAME.useNotify, args)
export const useMaterial = (...args: any[]): UseMaterialApi => getHook(HOOK_NAME.useMaterial, args)
export const useStyle = (...args: any[]) => getHook(HOOK_NAME.useStyle, args)
export const useCustom = (...args: any[]) => getHook(HOOK_NAME.useCustom, args)

export function initHook(
  hookName: HookName,
  hookContent: any,
  { useDefaultExport } = {} as { useDefaultExport?: boolean }
) {
  if (!Object.keys(hooksState).includes(hookName)) {
    throw new Error('Invalid hook name provided: ' + hookName)
  }
  if (useDefaultExport) {
    hooksState[hookName] = hookContent
  } else {
    Object.assign(hooksState[hookName], hookContent)
  }

  return hooksState[hookName]
}
