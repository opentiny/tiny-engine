// Process polyfill for browser environment
const process = {
  env: {},
  version: '0.11.10',
  versions: {
    node: '16.0.0'
  },
  platform: 'browser',
  arch: 'unknown',
  release: {},
  config: {}
}

// Ensure process is available globally
if (typeof window !== 'undefined') {
  window.process = process
  window.global = window.globalThis
}

// Also set it on globalThis for better compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.process = process
  globalThis.global = globalThis
}

export default process