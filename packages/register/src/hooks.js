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
  useMaterial: 'material'
}

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
  [HOOK_NAME.useCustom]: {} // 自定义
}

const getHook = (hookName, args) => {
  if (typeof hooksState[hookName] === 'function') {
    return hooksState[hookName](...args)
  }
  return hooksState[hookName]
}

export const useLayout = (...args) => getHook(HOOK_NAME.useLayout, args)
export const useCanvas = (...args) => getHook(HOOK_NAME.useCanvas, args)
export const useResource = (...args) => getHook(HOOK_NAME.useResource, args)
export const useHistory = (...args) => getHook(HOOK_NAME.useHistory, args)
export const useProperties = (...args) => getHook(HOOK_NAME.useProperties, args)
export const useSaveLocal = (...args) => getHook(HOOK_NAME.useSaveLocal, args)
export const useBlock = (...args) => getHook(HOOK_NAME.useBlock, args)
export const useTranslate = (...args) => getHook(HOOK_NAME.useTranslate, args)
export const usePage = (...args) => getHook(HOOK_NAME.usePage, args)
export const useDataSource = (...args) => getHook(HOOK_NAME.useDataSource, args)
export const useBreadcrumb = (...args) => getHook(HOOK_NAME.useBreadcrumb, args)
export const useProperty = (...args) => getHook(HOOK_NAME.useProperty, args)
export const useHelp = (...args) => getHook(HOOK_NAME.useHelp, args)
export const useHttp = (...args) => getHook(HOOK_NAME.useHttp, args)
export const useEnv = (...args) => getHook(HOOK_NAME.useEnv, args)
export const useModal = (...args) => getHook(HOOK_NAME.useModal, args)
export const useNotify = (...args) => getHook(HOOK_NAME.useNotify, args)
export const useMaterial = (...args) => getHook(HOOK_NAME.useMaterial, args)
export const useCustom = (...args) => getHook(HOOK_NAME.useCustom, args)

export function initHook(hookName, hookContent, { useDefaultExport } = {}) {
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
