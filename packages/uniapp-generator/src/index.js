import { generateApp as generateUniApp } from './generator/generateApp'
import { CodeGenerator } from '@tinyengine/vue-generator'
import { genSFCWithDefaultPlugin, generateSFCFile } from './generator/vue/sfc'

export { generateUniApp, CodeGenerator, genSFCWithDefaultPlugin, generateSFCFile }
export default generateUniApp