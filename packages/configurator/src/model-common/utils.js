import { getModelList } from './http'
import { typeComponentsMap } from './constants'

const handleModelParameters = (paramItem) => {
  const extension = {}
  if (paramItem.type === 'Enum') {
    extension.options = JSON.parse(paramItem.options) || []
  }
  const item = {
    ...paramItem,
    ...(typeComponentsMap[paramItem.type]?.props || {}),
    ...extension,
    originType: paramItem.type,
    label: paramItem?.label ?? paramItem.prop,
    isModel: paramItem.isModel,
    component: typeComponentsMap[paramItem.type]?.component ?? 'TinyInput',
    itemVisible: true
  }
  delete item.type
  return item
}

export const handleSelectedModelParameters = async (model) => {
  const parameters = await Promise.all(
    (model?.parameters || model).map(async (item) => {
      const defaultItem = handleModelParameters(item)
      // 如果是关联字段，则查询关联模型数据
      if (item?.isModel) {
        const data = await getModelList(1, { id: item.defaultValue })
        return {
          ...defaultItem,
          defaultValue: (data.records.length > 0 ? data.records[0].parameters : []).map((insideItem) =>
            handleModelParameters(insideItem)
          )
        }
      } else {
        return defaultItem
      }
    })
  )
  return model?.parameters
    ? {
        id: model.id,
        name: model.nameCn,
        nameEn: model.nameEn,
        description: model.description,
        version: model.version,
        baseUrl: model.modelUrl ?? '',
        parameters
      }
    : parameters
}
