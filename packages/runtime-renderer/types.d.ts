export declare global {
  interface Window {
    TinyLowcodeComponent: Record<string, any>
    TinyComponentLibs: Record<string, any>
    blocks: Record<string, any>
    __TINY_ENGINE_ENV__?: Record<string, any>
  }
}
