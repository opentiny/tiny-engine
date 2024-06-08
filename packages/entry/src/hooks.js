export const HOOK_NAME = {
  useLayout: 'layout',
  useApp: 'app',
  useCanvas: 'canvas',
  useResource: 'resource',
  useHistory: 'history',
  useProperties: 'properties',
  useProperty: 'property',
  useSaveLocal: 'saveLocal',
  useEditorInfo: 'editorInfo',
  useBlock: 'block',
  useTranslate: 'translate',
  usePage: 'page',
  useDataSource: 'dataSource',
  useBreadcrumb: 'breadcrumb',
  useHelp: 'help',
  useHttp: 'http',
  useEnv: 'env',
  useCustom: 'custom'
}

const hooksState = {
  [HOOK_NAME.useLayout]: {},
  [HOOK_NAME.useApp]: {},
  [HOOK_NAME.useCanvas]: {},
  [HOOK_NAME.useResource]: {},
  [HOOK_NAME.useHistory]: {},
  [HOOK_NAME.useProperties]: {},
  [HOOK_NAME.useProperty]: {},
  [HOOK_NAME.useSaveLocal]: {},
  [HOOK_NAME.useEditorInfo]: {},
  [HOOK_NAME.useBlock]: {},
  [HOOK_NAME.useTranslate]: {},
  [HOOK_NAME.usePage]: {},
  [HOOK_NAME.useDataSource]: {},
  [HOOK_NAME.useBreadcrumb]: {},
  [HOOK_NAME.useHelp]: {},
  [HOOK_NAME.useHttp]: {},
  [HOOK_NAME.useEnv]: {},
  [HOOK_NAME.useCustom]: {} // 自定义
}

export const useLayout = () => hooksState[HOOK_NAME.useLayout]
export const useCanvas = () => hooksState[HOOK_NAME.useCanvas]
export const useApp = () => hooksState[HOOK_NAME.useApp]
export const useResource = () => hooksState[HOOK_NAME.useResource]
export const useHistory = () => hooksState[HOOK_NAME.useHistory]
export const useProperties = () => hooksState[HOOK_NAME.useProperties]
export const useSaveLocal = () => hooksState[HOOK_NAME.useSaveLocal]
export const useEditorInfo = () => hooksState[HOOK_NAME.useEditorInfo]
export const useBlock = () => hooksState[HOOK_NAME.useBlock]
export const useTranslate = () => hooksState[HOOK_NAME.useTranslate]
export const usePage = () => hooksState[HOOK_NAME.usePage]
export const useDataSource = () => hooksState[HOOK_NAME.useDataSource]
export const useBreadcrumb = () => hooksState[HOOK_NAME.useBreadcrumb]
export const useProperty = () => hooksState[HOOK_NAME.useProperty]
export const useHelp = () => hooksState[HOOK_NAME.useHelp]
export const useHttp = () => hooksState[HOOK_NAME.useHttp]
export const useEnv = () => hooksState[HOOK_NAME.useEnv]
export const useCustom = () => hooksState[HOOK_NAME.useCustom]

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
