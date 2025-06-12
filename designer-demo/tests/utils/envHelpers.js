/**
 * 环境变量处理工具函数
 */
import fs from 'node:fs'

/**
 * 更新环境变量，如果变量不存在或值为false则设置为true
 * @param {string} content - 环境变量文件内容
 * @param {string} key - 环境变量名
 * @returns {string} - 更新后的内容
 */
export function ensureEnvVarEnabled(content, key, value = 'true') {
  // 检查是否包含该环境变量
  const regex = new RegExp(`${key}\\s*=\\s*(.*)`, 'm')
  const match = content.match(regex)
  
  if (!match) {
    // 变量不存在，添加
    return `${content}\n${key}=${value}`
  } else if (match[1].trim() !== value) {
    // 变量存在但值为跟 value 不相等，替换为提供的值 value
    return content.replace(regex, `${key}=${value}`)
  }
  
  // 变量已存在且不是false，保持不变
  return content
}

/**
 * 更新环境变量中的CDN域名
 * @param {string} content - 环境变量文件内容
 * @param {string} cdnDomain - CDN域名
 * @returns {string} - 更新后的内容
 */
export function updateCdnDomain(content, cdnDomain) {
  const regex = /VITE_CDN_DOMAIN\s*=\s*(.*)/m
  const match = content.match(regex)
  
  if (!match) {
    return `${content}\nVITE_CDN_DOMAIN=${cdnDomain}`
  } else {
    return content.replace(regex, `VITE_CDN_DOMAIN=${cdnDomain}`)
  }
}

/**
 * 备份环境变量文件
 * @param {string} envFilePath - 环境变量文件路径
 * @returns {void}
 */
export function backupEnvFile(envFilePath) {
  if (fs.existsSync(envFilePath)) {
    const backupPath = envFilePath + '.bak'
    fs.copyFileSync(envFilePath, backupPath)
  }
}

/**
 * 恢复环境变量文件
 * @param {string} envFilePath - 环境变量文件路径
 * @returns {void}
 */
export function restoreEnvFile(envFilePath) {
  const backupPath = envFilePath + '.bak'
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, envFilePath)
    fs.unlinkSync(backupPath)
  }
}
