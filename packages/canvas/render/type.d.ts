export declare global {
  interface Window {
    TinyLowcodeComponent: Record<string, any>
    TinyComponentLibs: Record<string, any>
    blocks: Record<string, any>
    thirdPartyDeps: {
      styles: Array<any>
      scripts: Array<any>
    }
    TinyGlobalConfig: Record<string, any>
    loadBlockComponent: (blockName: string) => Promise<any>
    host: any
  }
}
