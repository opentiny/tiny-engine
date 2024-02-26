export const VITE_ORIGIN = import.meta.env.VITE_ORIGIN
export const isMock = import.meta.env.VITE_API_MOCK === 'mock'
export const isVsCodeEnv = window.vscodeBridge
export const isDevelopEnv = import.meta.env.MODE?.includes('dev')