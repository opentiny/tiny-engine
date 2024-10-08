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
import JSZIP from 'jszip'

/**
 * 下载文件到本地
 * @param {Blob} blobData 文件二进制数据
 * @param {string} fileName 文件名
 */
export function saveAs(blobData, fileName) {
  const downloadLink = document.createElement('a')
  downloadLink.download = fileName
  downloadLink.style.display = 'none'
  downloadLink.href = URL.createObjectURL(blobData)
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

/**
 * 创建一个zip
 */
export const createZip = () => {
  return new JSZIP()
}

/**
 * 往zip里面写入文件夹和文件
 * @param {Array<FileInfo>} filesInfo 文件信息
 *          FileInfo.filePath 文件相对路径，以'/'相连
 *          FileInfo.fileContent 文件内容
 * @param {ZipExtraInfo} ZipExtraInfo zip额外信息
 *  {string} zipName 打出来的zip名称
 *  {JSZIP} zipHandle 创建好的zip句柄，可以不传，不传就用新的
 */
export const writeZip = (filesInfo, { zipHandle, zipName } = {}) => {
  let zip = zipHandle
  if (!zipHandle) {
    zip = createZip()
  }
  filesInfo.forEach(({ filePath, fileContent }) => {
    const file = filePath.split('/')
    const fileName = file.pop()
    const path = file.join('/')
    if (path) {
      zip.folder(path).file(fileName, fileContent)
    } else {
      zip.file(fileName, fileContent)
    }
  })
  // 把打包的内容异步转成blob二进制格式
  return zip.generateAsync({ type: 'blob' }).then((content) => {
    // content就是blob数据
    saveAs(content, `${zipName}.zip`)
  })
}
