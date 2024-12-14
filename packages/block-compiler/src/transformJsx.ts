import { transformSync } from '@babel/core'
import vueJsx from '@vue/babel-plugin-jsx'
import type { SFCDescriptor } from 'vue/compiler-sfc'

export const testIsJsx = (descriptor: SFCDescriptor) => {
  const lang = descriptor.script?.lang || descriptor?.scriptSetup?.lang || ''

  return /jsx$/.test(lang)
}

export const transformVueJsx = (sourceCode: string) => {
  return transformSync(sourceCode, {
    babelrc: false,
    plugins: [vueJsx],
    sourceMaps: false,
    configFile: false
  })?.code
}
