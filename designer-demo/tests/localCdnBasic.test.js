/**
 * localCDN 功能测试
 * 这个测试文件用于验证 localCDN 本地化功能是否正常工作
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { ensureEnvVarEnabled, backupEnvFile, restoreEnvFile } from './utils/envHelpers.js'

// 获取当前文件目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.resolve(projectRoot, 'dist')
const localCdnDir = path.resolve(distDir, 'local-cdn-static')
const envAlphaPath = path.resolve(projectRoot, 'env', '.env.alpha')

describe('localCDN 功能测试', () => {
  beforeAll(() => {
    // 备份环境变量文件
    backupEnvFile(envAlphaPath)
    
    // 确保环境变量正确设置
    let envContent = fs.readFileSync(envAlphaPath, 'utf-8')
    
    // 确保关键环境变量已启用
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_IMPORT_MAPS')
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_BUNDLE_DEPS')
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_IMPORT_PATH', 'local-cdn-static')
    
    // 写回更新后的环境变量
    fs.writeFileSync(envAlphaPath, envContent)
    
    // 执行构建
    execSync('pnpm run build:alpha', { 
      cwd: projectRoot, 
      stdio: 'inherit'
    })
  })
  
  // 测试结束后恢复原始环境变量
  afterAll(() => {
    restoreEnvFile(envAlphaPath)
  })
  
  it('应该在构建后生成 local-cdn-static 目录', () => {
    expect(fs.existsSync(localCdnDir)).toBe(true)
  })
  
  it('应该正确复制 @vue/devtools-api 依赖', () => {
    // 寻找 @vue/devtools-api 文件夹
    const devToolsDirs = fs.readdirSync(path.resolve(localCdnDir, '@vue'))
      .find(dir => dir.startsWith('devtools-api@'))
    
    expect(devToolsDirs).toBeDefined()
    
    // 检查 index.js 是否存在
    const indexJsExists = fs.existsSync(path.resolve(localCdnDir, '@vue', devToolsDirs, 'lib/esm/index.js'))
    
    expect(indexJsExists).toBe(true)
  })
  
  it('应该正确复制 vue 依赖', () => {
    // 寻找 vue 文件夹
    const runtimeDirs = fs.readdirSync(localCdnDir).find(dir => dir.startsWith('vue@'))

    expect(runtimeDirs).toBeDefined()
    
    const vueProdDist = path.resolve(localCdnDir, runtimeDirs, 'dist/vue.runtime.esm-browser.js')
    
    expect(fs.existsSync(vueProdDist)).toBe(true)
  })
}) 