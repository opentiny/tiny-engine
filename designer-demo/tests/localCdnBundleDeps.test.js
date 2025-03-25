/**
 * localCDN bundle依赖本地化测试
 * 测试物料需要的CDN资源本地化功能
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { ensureEnvVarEnabled, updateCdnDomain, backupEnvFile, restoreEnvFile } from './utils/envHelpers.js'

// 获取当前文件目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.resolve(projectRoot, 'public')
const bundleJsonDir = path.resolve(publicDir, 'mock')
const envAlphaPath = path.resolve(projectRoot, 'env', '.env.alpha')
const distDir = path.resolve(projectRoot, 'dist')
const bundleJsonPath = path.resolve(bundleJsonDir, 'bundle.json')

// 准备测试用的 bundle.json 文件
const testBundleJson = {
  data: {
    materials: {
      packages: [
        {
          "name": "TinyVue组件库",
          "package": "@opentiny/vue",
          "version": "3.20.0",
          "script": "https://unpkg.com/@opentiny/vue-runtime@3.20/dist3/tiny-vue-pc.mjs",
          "css": "https://unpkg.com/@opentiny/vue-theme@3.20/index.css"
        },
        {
          "name": "element-plus组件库",
          "package": "element-plus",
          "version": "2.4.2",
          "script": "https://registry.npmmirror.com/element-plus/2.4.2/files/dist/index.full.mjs",
          "css": "https://registry.npmmirror.com/element-plus/2.4.2/files/dist/index.css"
        }
      ]
    }
  }
}

describe('localCDN bundle依赖本地化测试', () => {
  let originalBundleJson = null

  beforeAll(() => {
    // 备份环境变量
    backupEnvFile(envAlphaPath)
    
    // 确保目录存在
    if (!fs.existsSync(bundleJsonDir)) {
      fs.mkdirSync(bundleJsonDir, { recursive: true })
    }
    
    // 备份原始的 bundle.json 文件（如果存在）
    if (fs.existsSync(bundleJsonPath)) {
      originalBundleJson = fs.readFileSync(bundleJsonPath, 'utf-8')
    }
    
    // 创建测试用的 bundle.json
    fs.writeFileSync(bundleJsonPath, JSON.stringify(testBundleJson, null, 2))
    
    // 设置环境变量
    let envContent = fs.readFileSync(envAlphaPath, 'utf-8')
    
    // 更新CDN域名
    envContent = updateCdnDomain(envContent, 'https://unpkg.com')
    
    // 确保启用了 bundle 依赖本地化
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_BUNDLE_DEPS')
    
    fs.writeFileSync(envAlphaPath, envContent)
    
    // 执行构建
    execSync('pnpm run build:alpha', { 
      cwd: projectRoot, 
      stdio: 'inherit'
    })
  })
  
  // 测试完成后清理测试文件并恢复环境变量
  afterAll(() => {
    // 恢复原始的 bundle.json 文件
    if (originalBundleJson) {
      fs.writeFileSync(bundleJsonPath, originalBundleJson)
    } else if (fs.existsSync(bundleJsonPath)) {
      // 如果原始文件不存在，则删除测试创建的文件
      fs.unlinkSync(bundleJsonPath)
    }
    
    // 恢复环境变量
    restoreEnvFile(envAlphaPath)
  })
  
  it('应该将物料CDN依赖本地化', () => {
    const distBundleJsonPath = path.resolve(distDir, 'mock', 'bundle.json')
    
    // 检查构建后的 bundle.json 是否存在
    expect(fs.existsSync(distBundleJsonPath)).toBe(true)
    
    // 检查构建后的 bundle.json 中是否已将远程URL替换为本地路径
    const packages = JSON.parse(fs.readFileSync(distBundleJsonPath, 'utf-8')).data.materials.packages
    
    // 检查 vue 的路径是否已本地化
    expect(packages[0].script).not.toContain('https://unpkg.com')
    expect(packages[0].script).toContain('./material-static/')
    
    // 检查 element-plus 的路径是否已本地化
    expect(packages[1].script).toContain('https://registry.npmmirror.com')
    expect(packages[1].script).not.toContain('./material-static/')
    expect(packages[1].css).toContain('https://registry.npmmirror.com')
    expect(packages[1].css).not.toContain('./material-static/')
  })
  
  it('应该将物料依赖包复制到产物CDN目录', () => {
    const localCdnDir = path.resolve(distDir, 'material-static/@opentiny')
    
    // 检查 vue 是否已复制
    const tinyVueDir = fs.readdirSync(localCdnDir)
      .find(dir => dir.startsWith('vue-runtime@'))
    const tinyVueThemeDir = fs.readdirSync(localCdnDir)
      .find(dir => dir.startsWith('vue-theme@'))
    expect(tinyVueDir).toBeDefined()
    
    // 检查 tiny-vue-pc.mjs 是否存在
    const tinyVueJsPath = path.resolve(localCdnDir, tinyVueDir, 'dist3', 'tiny-vue-pc.mjs')
    const tinyVueCssPath = path.resolve(localCdnDir, tinyVueThemeDir, 'index.css')

    expect(fs.existsSync(tinyVueJsPath)).toBe(true)
    expect(fs.existsSync(tinyVueCssPath)).toBe(true)
    
    // 检查 element-plus 是否已复制
    const elementDir = fs.readdirSync(localCdnDir)
      .find(dir => dir.startsWith('element-plus@'))

    expect(elementDir).not.toBeDefined()
  })
}) 