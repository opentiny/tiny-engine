import { usePage } from '@opentiny/tiny-engine-meta-register'

export async function getAllPages() {
  const { getPageList } = usePage()
  const [firstGroup, secondGroup] = await getPageList()
  const data: any[] = []
  const getPages = (list: any[]) => {
    list.forEach((item) => {
      data.push({
        id: item.id,
        name: item.name,
        route: item.route,
        parentId: item.parentId
      })

      if (item.children) {
        getPages(item.children)
      }
    })
  }

  getPages([...firstGroup.data, ...secondGroup.data])

  return data
}
