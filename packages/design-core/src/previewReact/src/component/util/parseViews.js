import { capitalizeFirstLetter } from '../../../../../../react-generator/src/utils/uaperCase'
export const parseView = (views) => {
  if (!views || Object.keys(views).length === 0) {
    return
  }

  const name = capitalizeFirstLetter(views['pageInfo']['name'])
  let code = views['Main.jsx']

  code = code.replace(/Antd/g, 'Antd.')

  // 使用正则表达式删除所有 import 语句
  const noImportContent =
    code.replace(/^import\s+.*$/gm, '').replace(/export\s+default\s+[A-Za-z0-9_]+\s*/, '') + `\n render(<${name}/>)`

  return noImportContent
}
