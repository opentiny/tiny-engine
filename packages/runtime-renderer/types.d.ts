export declare global {
  interface Window {
    TinyLowcodeComponent: Record<string, any>
    TinyComponentLibs: Record<string, any>
    blocks: Record<string, any>
  }
}
export declare module '@opentiny/tiny-engine-dsl-vue' {
  // 先声明原有导出（避免覆盖库的默认类型）
  export type * from '@opentiny/tiny-engine-dsl-vue'
  // 补充 genSFCWithDefaultPlugin 的声明（根据实际参数/返回值调整类型）
  export function genSFCWithDefaultPlugin(schema?: any, componentsMap?: any, config = {}, nextPage?: any): any
}
