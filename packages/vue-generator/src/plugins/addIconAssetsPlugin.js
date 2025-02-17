/* 遍历schema查询所有使用到的自定义图标 */
function findUniqueIcons(Pages) {
  const uniqueIcons = {}

  function traverse(node) {
    if (node.componentName === 'Icon') {
      const name = node.props.name
      if (!uniqueIcons[name]) {
        uniqueIcons[name] = node
      }
    }

    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  Pages.forEach((page) => traverse(page))

  return Object.values(uniqueIcons)
}

/* 生成svg文件 */
function createSVG({ width, height, body }) {
  return `<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 ${width} ${height}">${body}</svg>`
}

/* 生成自定义图标文件 */
const addIconAssets = () => {
  return {
    name: 'importIconsFile',
    description: '写入图标文件',
    run(schema) {
      const { iconsMap } = schema
      const icons = findUniqueIcons(schema.pageSchema)

      const resPage = []

      icons.forEach((icon) => {
        if (icon.props.name.includes(':')) {
          const collectionName = icon.props.name.split(':')[0]
          const iconName = icon.props.name.split(':')[1]

          // 如果存在图标资源则写入文件
          if (iconsMap[`${collectionName}:${iconName}`]) {
            resPage.push({
              fileType: 'svg',
              fileName: `${iconName}.svg`,
              path: `./src/assets/icons/${collectionName}`,
              fileContent: createSVG(iconsMap[`${collectionName}:${iconName}`])
            })
          }
        }
      })
      return resPage
    }
  }
}

export default addIconAssets
