import { Buffer } from 'buffer'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import path from 'node:path'
import Logger from './logger.mjs'

const logger = new Logger('uploadMaterials')

// 先构造出.env*文件的绝对路径
const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)
const pathsDotenv = resolveApp('.env')
dotenv.config({ path: `${pathsDotenv}.local` })
const { backend_url } = process.env

const bundlePath = path.join(process.cwd(), '/designer-demo/public/mock/bundle.json')
const bundle = fs.readJSONSync(bundlePath)
const jsonBuffer = Buffer.from(JSON.stringify(bundle))
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
const formHeaders = {
  'Content-Type': `multipart/form-data; boundary=${boundary}`,
}

let body = `--${boundary}\r\n`
body += 'Content-Disposition: form-data; name="file"; filename="bundle.json"\r\n'
body += 'Content-Type: application/json\r\n\r\n'
body += jsonBuffer.toString() + `\r\n--${boundary}--`

fetch(backend_url, {
  method: 'POST',
  headers: formHeaders,
  body: body,
})
  .then(response => response.json())
  .then(data => {
    logger.success('File uploaded successfully:', data)
  })
  .catch(error => {
    logger.error('Error uploading file:', error)
  })
