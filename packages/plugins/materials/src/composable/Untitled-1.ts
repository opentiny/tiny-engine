import { getGlobalConfig } from './globalConfig'

import { useHttp } from '@opentiny/tiny-engine-http'
import { constants } from '@opentiny/tiny-engine-utils'

const { MATERIAL_TYPE } = constants
const http = useHttp()

const registerComponent = (data, resource) => {
  if (Array.isArray(data.component)) {
    const { component, ...others } = data
    component.forEach((item) => {
      resource.set(item, { item, ...others, type: MATERIAL_TYPE.Component })
    })
  } else {
    resource.set(data.component, { ...data, type: MATERIAL_TYPE.Component })
  }

  return data
}

/**
 * 收集第三方组件库依赖
 * @param {array} components 组件物料列表
 * return { styles, scripts }
 */
const generateThirdPartyDeps = (components) => {
  const styles = []
  const scripts = []

  components.forEach((item) => {
    const { npm, component } = item

    if (!npm || !Object.keys(npm).length) return

    const { package: pkg, script, exportName, css } = npm
    const currentPkg = scripts.find((item) => item.package === pkg)

    if (currentPkg) {
      // 保存组件id和导出组件名的对应关系 TinyButton： Button
      currentPkg.components[component] = exportName
    } else {
      scripts.push({
        package: pkg,
        script,
        components: {
          [component]: exportName
        }
      })
    }

    if (css) {
      styles.push(css)
    }
  })
  return { styles, scripts }
}

const addMaterials = (materials = {}, resState) => {
  generateThirdPartyDeps(materials.components, resState)
  resState.components.push(...materials.snippets)
  materials.components.map(registerComponent)

  const promises = materials?.blocks?.map((item) => registerBlock(item, true))
  Promise.allSettled(promises).then((blocks) => {
    if (!blocks?.length) {
      return
    }
    // 默认区块都会展示在默认分组中
    if (!resState.blocks?.[0]?.children) {
      resState.blocks.push({
        groupId: useBlock().DEFAULT_GROUP_ID,
        groupName: useBlock().DEFAULT_GROUP_NAME,
        children: []
      })
    }
    resState.blocks[0].children.unshift(...blocks.filter((res) => res.status === 'fulfilled').map((res) => res.value))
  })
}

export const getMaterialsUrl = async (bundleUrls) => {
  const materials = await Promise.allSettled(bundleUrls.map((url) => http.get(url)))
  return materials
}

export const getMaterialsRes = () => {
  const { dslMode, canvasOptions } = getGlobalConfig()
  const bundleUrls = canvasOptions[dslMode].material
  return bundleUrls
}

export const fetchMaterial = async (resState) => {
  // 在这里增加物料获取之前hooks
  const bundleUrls = getMaterialsUrl()
  const materials = await getMaterialsUrl(bundleUrls)

  // 在这里增加物料获取之后hooks
  materials.forEach((response) => {
    if (response.status === 'fulfilled' && response.value.materials) {
      addMaterials(response.value.materials, resState)
    }
  })
}

export default function () {}
