import GenerateMaterial from './common/GenerateMaterial-old.mjs';

function checkIsStandardTable(params, standard) {
  const { col, content } = params
  for (let i = 0; i < col; i++) {
    const item = standard[i];
    const ct = content[i]
    if (Array.isArray(item)) {
      if (!item.includes(ct)) {
        return false
      }
    } else {
      if (item !== ct && !!item !== !!ct) {
        return false
      }
    }
  }
  return true
}

async function main() {
  const gm = new GenerateMaterial({
    owner: "vueComponent",
    repo: "ant-design-vue",
    path: "components",
    host: "https://api.github.com",
    version: "4.1.2",
    projectName: "ant-design-vue",
    framework: "Vue",
    script: "https://npm.onmicrosoft.cn/ant-design-vue@4.1.2/dist/antd.esm.js",
    css: "https://npm.onmicrosoft.cn/ant-design-vue@4.1.2/dist/reset.css",
    exportNamePrefix: "A",
    // github api token
    token: null,
    isAttributeTable(params) {
      const standard = [['参数', '属性', '成员', 'Property'], ['说明', 'Description'], ['类型', 'Type'], ['默认值', 'Default'], ['版本', 'Version', '']]
      return checkIsStandardTable(params, standard)
    },
    isEvent(params) {
      const standard = ['事件名称', '说明', '回调参数', '版本', undefined]
      return checkIsStandardTable(params, standard)
    },
  })
  await gm.start()
}
main()