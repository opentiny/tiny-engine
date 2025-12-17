export function useEnv(): Record<string, string> {
  const env = import.meta.env
  return { ...env }
}

export const defaultConfig = {
  material: ['/mock/bundle.json'],
  importMap: {
    imports: {}
  },
  // 是否开启 TailWindCSS 特性
  enableTailwindCSS: true
}

export default defaultConfig
