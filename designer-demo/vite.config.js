import path from 'node:path'
import { tinyEnginePreset } from '@opentiny/tiny-engine-vite-config'

export default tinyEnginePreset({
  iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/assets/')],
  useSourceAlias: true
}, () => {
  const envDir = path.resolve(process.cwd(), 'env')

  const config = {
    envDir,
    publicDir: path.resolve(__dirname, './public'),
    server: {
      port: 8090
    }
  }
  
  return config
})
