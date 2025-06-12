/**
 * localCDN 自定义配置测试
 * 测试文档中描述的自定义配置功能
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
const viteConfigPath = path.resolve(projectRoot, 'vite.config.js')
const envAlphaPath = path.resolve(projectRoot, 'env', '.env.alpha')
const originalViteConfig = fs.readFileSync(viteConfigPath, 'utf-8')
const distDir = path.resolve(projectRoot, 'dist')

/**
 * 更新 registry.js 文件以支持自定义 importMap
 */
function updateRegistryFile() {
  const registryPath = path.resolve(projectRoot, 'registry.js')
  
  if (!fs.existsSync(registryPath)) {
    return
  }
  
  // 备份原始文件
  fs.copyFileSync(registryPath, registryPath + '.bak')
  
  const registryContent = fs.readFileSync(registryPath, 'utf-8')
  
  // 向 config 对象添加 importMap
  const updatedContent = registryContent.replace(
    /config: {([^}]*)}/,
    `config: {$1,
      importMap: { 
        imports: {
          'vue': "\${VITE_CDN_DOMAIN}/vue\${versionDelimiter}3.4.21\${fileDelimiter}/dist/vue.runtime.esm-browser.js"
        } 
      }
    }`
  )
  
  fs.writeFileSync(registryPath, updatedContent)
}

/**
 * 恢复 registry.js 文件
 */
function restoreRegistryFile() {
  const registryPath = path.resolve(projectRoot, 'registry.js')
  const backupPath = registryPath + '.bak'
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, registryPath)
    fs.unlinkSync(backupPath)
  }
}

describe('localCDN 自定义配置测试', () => {
  beforeAll(() => {
    // 备份原始的 vite.config.js
    fs.writeFileSync(viteConfigPath + '.bak', originalViteConfig)
    
    // 备份环境变量文件
    backupEnvFile(envAlphaPath)
    
    // 修改 vite.config.js 添加自定义配置
    const updatedViteConfig = originalViteConfig.replace(
      'const baseConfig = useTinyEngineBaseConfig({',
      `const baseConfig = useTinyEngineBaseConfig({
    importMapLocalConfig: {
      importMap: { 
        imports: {
          'vue': "\${VITE_CDN_DOMAIN}/vue\${versionDelimiter}3.4.21\${fileDelimiter}/dist/vue.runtime.esm-browser.prod.js"
        } 
      },
      copy: {
        'vue': {
          filePathInPackage: '/dist/'
        }
      }
    },`
    )
    
    fs.writeFileSync(viteConfigPath, updatedViteConfig)
    
    // 确保环境变量设置
    let envContent = fs.readFileSync(envAlphaPath, 'utf-8')
    
    // 确保关键环境变量已启用
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_IMPORT_MAPS')
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_BUNDLE_DEPS')
    envContent = ensureEnvVarEnabled(envContent, 'VITE_LOCAL_IMPORT_PATH', 'local-cdn-static')
    
    // 写回更新后的环境变量
    fs.writeFileSync(envAlphaPath, envContent)
    
    // 修改 registry.js 以支持自定义 importMap
    updateRegistryFile()
    
    // 执行构建
    execSync('pnpm run build:alpha', { 
      cwd: projectRoot, 
      stdio: 'inherit'
    })
  })
  
  // 测试完成后恢复原始配置
  afterAll(() => {
    // 恢复 vite.config.js
    if (fs.existsSync(viteConfigPath + '.bak')) {
      fs.copyFileSync(viteConfigPath + '.bak', viteConfigPath)
      fs.unlinkSync(viteConfigPath + '.bak')
    }
    
    // 恢复环境变量
    restoreEnvFile(envAlphaPath)
    
    // 恢复 registry.js
    restoreRegistryFile()
  })
  
  it('应该正确应用自定义 importMap 配置', () => {
    const localCdnDir = path.resolve(distDir, 'local-cdn-static')
    
    // 检查 vue 是否被正确复制
    const vueDirs = fs.readdirSync(localCdnDir)
      .filter(dir => dir.startsWith('vue@'))
      .map(dir => path.resolve(localCdnDir, dir))
    
    expect(vueDirs.length).toBeGreaterThan(0)
    
    // 检查 dist 目录是否存在
    const distExists = vueDirs.some(dir => {
      return fs.existsSync(path.resolve(dir, 'dist'))
    })
    
    expect(distExists).toBe(true)
    
    // 检查 vue.global.prod.js 文件是否存在
    const vueJsExists = vueDirs.some(dir => {
      return fs.existsSync(path.resolve(dir, 'dist', 'vue.runtime.esm-browser.js'))
    })

    expect(vueJsExists).toBe(true)

    // 检查 dist 目录下的文件数量是否大于1 (因为我们的复制配置是复制整个文件夹)
    const distFileCount = vueDirs.some(dir => {
      const distPath = path.resolve(dir, 'dist')
      return fs.existsSync(distPath) && fs.readdirSync(distPath).length > 1
    })
    
    expect(distFileCount).toBe(true)
  })
}) 