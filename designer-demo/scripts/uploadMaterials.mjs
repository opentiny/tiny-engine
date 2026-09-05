import dotenv from 'dotenv'
import fs from 'fs-extra'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import Logger from './logger.mjs'


/**
 * 同步物料资产包到后端数据库
 * 1. 读取 env/.env.local 文件，获取后端地址。需要设置地址如：backend_url=http://localhost:9090
 * 2. 读取 public/mock/bundle.json 文件，获取物料资产包数据
 * 3. 将物料资产包数据通过 POST 请求上传到后端接口 /material-center/api/component/bundle/create
 * 4. 检查数据库t_component表中数据是否更新成功
 * 
 * 使用场景：
 * 1. 本地已经将 bundle.json 文件进行修改，但是数据需要同步到后端数据库中。
 * 2. 本地已经将 bundle.json 文件进行修改，但是出码仍然不正确。
 * @returns 
 */
async function main() {
  const logger = new Logger('uploadMaterials')
  
  // 先构造出.env*文件的绝对路径
  const appDirectory = fs.realpathSync(process.cwd())
  const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)
  const pathsDotenv = resolveApp('env')
  logger.info(`Start to load .env.local file from ${pathsDotenv}/.env.local`)
  dotenv.config({ path: `${pathsDotenv}/.env.local` })
  const { backend_url } = process.env

  if (!backend_url) {
    logger.error('backend_url is not set in .env.local file')
    process.exit(1)
  }
  
  const bundlePath = path.join(process.cwd(), './public/mock/bundle.json')
  logger.info(`Start to read bundle.json file from ${bundlePath}`)
  const bundle = fs.readJSONSync(bundlePath)
  const jsonBuffer = Buffer.from(JSON.stringify(bundle))
  
  const requestUrl = (backend_url.endsWith('/') ? backend_url.slice(0, -1) : backend_url) + '/material-center/api/component/bundle/create'
  logger.info(`Start to upload bundle.json file to ${requestUrl}`)
  try {
    const formData = new FormData()
    formData.append('file', new Blob([jsonBuffer], { type: 'application/json'}), 'bundle.json')
    const response = await fetch(requestUrl, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }
    const data = await response.json()
    if (data && data.success) {
      logger.success(`File uploaded successfully：${JSON.stringify(data)}`)
    } else {
      logger.warn(`Upload completed but success flag is false: ${JSON.stringify(data)}`)
      logger.warn(`Upload completed with warnings: ${JSON.stringify(data.message)}`)
    }
  } catch (error) {
    logger.error('Error uploading file:', error instanceof Error ? error.message : String(error))
  }
}

main()
.catch((e) => {
  const logger = new Logger('uploadMaterials')
  logger.error('Error uploading file:', e instanceof Error ? e.message : String(e));
  process.exit(1);
})
