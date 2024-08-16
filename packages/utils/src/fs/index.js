/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

// browser File System Access API encapsulation

import { createZip, writeZip } from './fszip'

// 支持file system api的条件：存在这个方法 && 不处于iframe中
export const isSupportFileSystemAccess =
  Object.prototype.hasOwnProperty.call(window, 'showDirectoryPicker') && window.self === window.top

/**
 * 获取用户选择并授权的文件夹根路径
 * @param {*} options
 *  mode: 授权模式 e.g. 'readwrite'
 * @returns dirHandle 目录句柄
 */
export const getUserBaseDirHandle = async (options = {}) => {
  if (!isSupportFileSystemAccess) {
    return createZip()
  }
  const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', ...options })
  return dirHandle
}

/**
 * 获取目录句柄
 * @param {*} baseDirHandle 根目录句柄
 * @param {Array<string>} pathArr 相对路径(相对根路径)
 * @param {boolean} create true:不存在则创建
 * @returns dirHandle | null
 */
export async function getDirectoryHandle(baseDirHandle, pathArr = [], { create = false } = {}) {
  if (!baseDirHandle) {
    return null
  }

  let currentHandle = baseDirHandle

  for (const curPath of pathArr) {
    currentHandle = await currentHandle.getDirectoryHandle(curPath, { create })
  }

  return currentHandle
}

/**
 * 获取文件句柄
 * @param {*} baseDirHandle  根目录句柄
 * @param {string} filePath 相对路径(相对根路径)
 * @param {*} options
 *        {boolean} create true:不存在则创建
 * @returns fileHandle | null
 */
export async function getFileHandle(baseDirHandle, filePath, { create = false } = {}) {
  if (!baseDirHandle || !filePath) {
    return null
  }

  const pathArr = filePath.split('/')
  const fileName = pathArr.pop()
  const dirHandle = await getDirectoryHandle(baseDirHandle, pathArr, { create })
  const fileHandle = await dirHandle.getFileHandle(fileName, { create })

  return fileHandle
}

/**
 * 获取用户选择并授权的文件路径
 * @param {*} options
 *  mode: 授权模式 e.g. 'readwrite'
 * @returns fileHandle 文件句柄
 */
export const getUserFileHandle = async (options = {}) => {
  if (!isSupportFileSystemAccess) {
    throw new Error('不支持的浏览器或处于iframe中')
  }
  const [fileHandle] = await window.showOpenFilePicker({ mode: 'readwrite', ...options })
  return fileHandle
}

/**
 * 读取文件内容
 * @param {*} baseDirHandle  根目录句柄
 * @param {*} filePath 文件相对路径(相对根目录)
 * @return {string} 文件内容
 */
export const readFile = async (baseDirHandle, filePath) => {
  if (!baseDirHandle || !filePath) {
    return undefined
  }

  const fileHandle = await getFileHandle(baseDirHandle, filePath)
  const file = await fileHandle.getFile()
  const content = await file.text()

  return content
}

/**
 * 读取目录文件列表
 * @param {*} baseDirHandle  根目录句柄
 * @param {string} dirPath 目录相对路径
 * @returns {Array<Handle>} 目录文件列表  Handle:句柄
 *          Handle.type 类型  'file' | 'directory'
 *          Handle.name 名称
 */
export const readDir = async (baseDirHandle, dirPath) => {
  let dirHandle = baseDirHandle
  if (!baseDirHandle) {
    return undefined
  }

  if (dirPath) {
    const pathArr = dirPath.split('/')
    dirHandle = await getDirectoryHandle(baseDirHandle, pathArr)
  }

  const dirs = []
  for await (const value of dirHandle.values()) {
    dirs.push(value)
  }

  return dirs
}

/**
 * 写入文件(不存在则创建)
 * @param {*} baseDirHandle  根目录句柄
 * @param {Object} fileInfo
 *        {string} filePath 文件相对路径(相对根目录)
 *        {string} fileContent 文件内容
 */
export const writeFile = async (handle, { filePath, fileContent }) => {
  let directoryHandle = null
  let fileHandle = null
  let fileName

  if (!handle || (handle.type === 'directory' && !filePath)) {
    throw new Error('invalid handle.')
  }

  if (handle.type === 'file') {
    fileHandle = handle
    fileName = handle.name
  } else {
    directoryHandle = handle
    const pathArr = filePath.split('/')
    fileName = pathArr.pop()

    const dirHandle = await getDirectoryHandle(directoryHandle, pathArr, { create: true })
    fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
  }

  const writable = await fileHandle.createWritable()
  await writable.write(fileContent)
  await writable.close()
}

/**
 * 批量写入文件(不存在则创建)
 * @param {*} baseDirHandle 根目录句柄
 * @param {Array<FileInfo>} filesInfo 文件信息
 *          FileInfo.filePath 文件相对路径
 *          FileInfo.fileContent 文件内容
 * @param {Boolean} supportZipCache 是否支持zip缓存，zip缓存可能会导致文件不能及时更新，默认不缓存
 *
 */
export const writeFiles = async (
  baseDirHandle,
  filesInfo,
  zipName = 'tiny-engine-generate-code',
  supportZipCache = false
) => {
  if (!filesInfo?.length) {
    return
  }

  if (!isSupportFileSystemAccess) {
    const zipInfo = { zipName, zipHandle: supportZipCache && baseDirHandle }
    await writeZip(filesInfo, zipInfo)
    return
  }

  let directoryHandle = baseDirHandle
  if (!directoryHandle) {
    directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
  }

  await Promise.all(filesInfo.map((fileInfo) => writeFile(directoryHandle, fileInfo)))
}
