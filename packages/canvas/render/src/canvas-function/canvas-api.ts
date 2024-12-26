import type { useBridge, useDataSourceMap, useGlobalState, useUtils } from '../application-function'
import type { IPageContext, useSchema } from '../page-block-function'
import type { useCustomRenderer } from './custom-renderer'
import type { setConfigure } from '../material-function'
import type { getDesignMode, setDesignMode } from './design-mode'
import type { setController } from './controller'

export interface IApplicationFunctionAPI
  extends Pick<ReturnType<typeof useUtils>, 'getUtils' | 'setUtils' | 'updateUtils' | 'deleteUtils'>,
    Pick<ReturnType<typeof useBridge>, 'getBridge' | 'setBridge'>,
    Pick<ReturnType<typeof useGlobalState>, 'getGlobalState' | 'setGlobalState'>,
    Pick<ReturnType<typeof useDataSourceMap>, 'getDataSourceMap' | 'setDataSourceMap'> {}
export interface IPageFunctionAPI
  extends Pick<
    ReturnType<typeof useSchema>,
    | 'getSchema'
    | 'setSchema'
    | 'setState'
    | 'deleteState'
    | 'getState'
    | 'getProps'
    | 'setProps'
    | 'getMethods'
    | 'setMethods'
    | 'setPagecss'
  > {}
export interface IPageContextAPI
  extends Pick<
    IPageContext,
    'getContext' | 'getNode' | 'getRoot' | 'setNode' | 'setCondition' | 'getCondition' | 'getConditions'
  > {}
export interface ICanvasFunctionAPI extends Pick<ReturnType<typeof useCustomRenderer>, 'getRenderer' | 'setRenderer'> {
  getDesignMode: typeof getDesignMode
  setDesignMode: typeof setDesignMode
  setController: typeof setController
  setConfigure: typeof setConfigure
}
export type IInnerCanvasAPI = IApplicationFunctionAPI & IPageFunctionAPI & ICanvasFunctionAPI & IPageContextAPI

let currentApi: IInnerCanvasAPI

export function setCurrentApi(activeApi) {
  currentApi = activeApi
}

export const api: IInnerCanvasAPI = {
  getUtils: (...args) => currentApi?.getUtils(...args),
  setUtils: (...args) => currentApi?.setUtils(...args),
  updateUtils: (...args) => currentApi?.updateUtils(...args),
  deleteUtils: (...args) => currentApi?.deleteUtils(...args),
  getBridge: (...args) => currentApi?.getBridge(...args),
  setBridge: (...args) => currentApi?.setBridge(...args),
  getMethods: (...args) => currentApi?.getMethods(...args),
  setMethods: (...args) => currentApi?.setMethods(...args),
  setController: (...args) => currentApi?.setController(...args),
  setConfigure: (...args) => currentApi?.setConfigure(...args),
  getSchema: (...args) => currentApi?.getSchema(...args),
  setSchema: (...args) => currentApi?.setSchema(...args),
  getState: (...args) => currentApi?.getState(...args),
  deleteState: (...args) => currentApi?.deleteState(...args),
  setState: (...args) => currentApi?.setState(...args),
  getProps: (...args) => currentApi?.getProps(...args),
  setProps: (...args) => currentApi?.setProps(...args),
  getContext: (...args) => currentApi?.getContext(...args),
  getNode: (...args) => currentApi?.getNode(...args),
  getRoot: (...args) => currentApi?.getRoot(...args),
  setPagecss: (...args) => currentApi?.setPagecss(...args),
  setCondition: (...args) => currentApi?.setCondition(...args),
  getCondition: (...args) => currentApi?.getCondition(...args),
  getConditions: (...args) => currentApi?.getConditions(...args),
  getGlobalState: (...args) => currentApi?.getGlobalState(...args),
  getDataSourceMap: (...args) => currentApi?.getDataSourceMap(...args),
  setDataSourceMap: (...args) => currentApi?.setDataSourceMap(...args),
  setGlobalState: (...args) => currentApi?.setGlobalState(...args),
  setNode: (...args) => currentApi?.setNode(...args),
  getRenderer: (...args) => currentApi?.getRenderer(...args),
  setRenderer: (...args) => currentApi?.setRenderer(...args),
  getDesignMode: (...args) => currentApi?.getDesignMode(...args),
  setDesignMode: (...args) => currentApi?.setDesignMode(...args)
}
