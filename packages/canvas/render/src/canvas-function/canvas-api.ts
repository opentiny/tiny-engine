import type { useDataSourceMap, useUtils } from '../application-function'
import type { IPageContext } from '../page-block-function'
import type { useCustomRenderer } from './custom-renderer'
import type { removeBlockCompsCache, setConfigure } from '../material-function'
import type { getDesignMode, setDesignMode } from './design-mode'
import type { setController, getController } from './controller'

export interface IApplicationFunctionAPI
  extends Pick<ReturnType<typeof useUtils>, 'getUtils'>,
    Pick<ReturnType<typeof useDataSourceMap>, 'getDataSourceMap'> {}
export type IPageContextAPI = Pick<IPageContext, 'setCondition' | 'getConditions'>
export interface ICanvasFunctionAPI extends ReturnType<typeof useCustomRenderer> {
  getDesignMode: typeof getDesignMode
  setDesignMode: typeof setDesignMode
  setController: typeof setController
  getController: typeof getController
  setConfigure: typeof setConfigure
  updateCanvas: () => void
}
export interface IMaterialFunctionAPI {
  removeBlockCompsCache: typeof removeBlockCompsCache
}

export type IInnerCanvasAPI = IApplicationFunctionAPI & ICanvasFunctionAPI & IPageContextAPI & IMaterialFunctionAPI

let currentApi: IInnerCanvasAPI

export function setCurrentApi(activeApi: IInnerCanvasAPI) {
  currentApi = activeApi
}

export const api: IInnerCanvasAPI = {
  getUtils: (...args) => currentApi?.getUtils(...args),
  setController: (...args) => currentApi?.setController(...args),
  getController: (...args) => currentApi?.getController(...args),
  setConfigure: (...args) => currentApi?.setConfigure(...args),
  setCondition: (...args) => currentApi?.setCondition(...args),
  getConditions: (...args) => currentApi?.getConditions(...args),
  getDataSourceMap: (...args) => currentApi?.getDataSourceMap(...args),
  getRenderer: (...args) => currentApi?.getRenderer(...args),
  setRenderer: (...args) => currentApi?.setRenderer(...args),
  getDesignMode: (...args) => currentApi?.getDesignMode(...args),
  setDesignMode: (...args) => currentApi?.setDesignMode(...args),
  removeBlockCompsCache: (...args) => currentApi?.removeBlockCompsCache(...args),
  updateCanvas: (...args) => currentApi?.updateCanvas(...args)
}
