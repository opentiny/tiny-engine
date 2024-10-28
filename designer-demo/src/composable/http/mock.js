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

const arrData = []
const blockList = []
let tempObj = null
let blockCount = 0
let blockProgress = 0

export default [
  // 获取app的详细信息
  {
    url: /\/app-center\/api\/apps\/detail/,
    response: async () => {
      const getAppInfo = async () => {
        const response = await fetch('/mock/appInfo.json')
        return response.json()
      }

      const appInfoRes = await getAppInfo()
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, appInfoRes])
        }, 1000)
      })
    }
  },
  {
    url: /api\/apps\/i18n\/entries/,
    response: async () => {
      const getAppInfo = async () => {
        const response = await fetch('/mock/i18n.json')
        return response.json()
      }

      const appInfoRes = await getAppInfo()
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, appInfoRes])
        }, 1000)
      })
    }
  },
  // 获取应用列表信息
  {
    url: /\/app-center\/api\/apps\/list/,
    response: async () => {
      const getAppList = async () => {
        const response = await fetch('/mock/appList.json')
        return response.json()
      }

      const appListRes = await getAppList()
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, appListRes])
        }, 1000)
      })
    }
  },
  // 页面管理 - 获取页面详情
  {
    url: /\/app-center\/api\/pages\/detail/,
    response: async (config) => {
      const url = config.url
      const pageId = url.substr(url.lastIndexOf('/') + 1)

      // 根据pageId加载不同的页面详情
      const pageDetail = async (pageId) => {
        const response = await fetch(`/mock/pageDetail/${pageId}.json`)
        return response.json()
      }

      const pageInfo = await pageDetail(pageId)

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, pageInfo])
        }, 1000)
      })
    }
  },
  // 页面管理 - 获取页面列表
  {
    url: /\/app-center\/api\/pages\/list\/\d+/,
    response: async () => {
      const getPageList = async () => {
        const response = await fetch('/mock/pageLists.json')
        return response.json()
      }

      const pageListRes = await getPageList()

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, pageListRes])
        }, 1000)
      })
    }
  },
  // 页面管理 - 获取文件夹列表列表
  {
    url: /\/app-center\/api\/folders\/list/,
    response: async () => {
      const getPageList = async () => {
        const response = await fetch('/mock/pageFolder.json')
        return response.json()
      }

      const pageListRes = await getPageList()

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, pageListRes])
        }, 1000)
      })
    }
  },
  // 页面管理 -- 新建页面
  {
    url: /\/app-center\/api\/pages\/create/,
    response: async (config) => {
      const createPage = async () => {
        const response = await fetch('/mock/createPage.json')
        return response.json()
      }

      const createPageRes = await createPage()
      const data = JSON.parse(config.data)
      const pageId = data.app

      if (pageId % 2) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, createPageRes])
          }, 500)
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '服务出错' } }])
        }, 500)
      })
    }
  },
  // 页面管理 -- 保存页面，同时创建页面备份记录
  {
    url: /\/app-center\/api\/pages\/update/,
    response: async (config) => {
      const savePage = async () => {
        const response = await fetch('/mock/savePage.json')
        return response.json()
      }

      const savePageRes = await savePage()

      const url = config.url
      const pageId = url.substr(url.lastIndexOf('/') + 1)

      if (pageId === '1') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, savePageRes])
          }, 1000)
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '服务出错' } }])
        }, 500)
      })
    }
  },
  // 页面管理 -- 复制页面
  /**
   * params
   *  {
   *    name:'',
   *    route:'',
   *    parent:''，
   *    groupId:''
   *  }
   * res
   *  {
   *    pages:[{},{}],
   *    pageInfo:{}
   *  }
   **/
  {
    url: /\/app-center\/api\/pages\/copy/,
    response: async (config) => {
      const newPage = JSON.parse(config.data)

      const pageList = async () => {
        const response = await fetch('/mock/pageList.json')

        return response.json()
      }

      const list = await pageList(newPage)
      list.data[0].data.push(newPage)

      const res = {
        data: {
          pages: list,
          newPage: newPage
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, res])
        }, 1000)
      })
    }
  },
  // 根据页面ID获取页面历史备份列表
  {
    url: /\/app-center\/api\/pageHistory\/list/,
    response: async (config) => {
      /**
       * 数据格式
       * [
       *   {
       *     "id": 1,
       *     "pageId": 1, // 页面ID，根据id获取页面详情
       *     "message": "修改文本内容",
       *     "time": "2022-02-06 18:00:00"
       *   }
       * ]
       */
      const pageId = config.url.substr(config.url.lastIndexOf('/') + 1)

      const pageHistory = async (pageId) => {
        const response = await fetch(`/mock/pageHistory/${pageId}.json`)
        return response.json()
      }

      const historyData = await pageHistory(pageId)

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, historyData])
        }, 1000)
      })
    }
  },
  // 删除页面备份记录
  {
    url: /\/app-center\/api\/pageHistory\/delete/,
    response: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200])
        }, 1000)
      })
    }
  },
  // 根据页面备份记录还原页面信息
  {
    url: /\/app-center\/api\/pageHistory\/restore/,
    response: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200])
        }, 1000)
      })
    }
  },
  // 创建区块分组信息
  {
    url: /\/material-center\/api\/block-groups\/create/,
    response: (config) => {
      const data = JSON.parse(config.data)
      const name = data.name

      const id = blockList.length + 1
      const group = {
        id,
        name,
        blocks: []
      }

      blockList.push(group)

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: group }])
        }, 500)
      })
    }
  },
  // 更新分组:修改分组名字/向分组里添加、删除区块
  {
    url: /\/material-center\/api\/block-groups\/update/,
    response: async (config) => {
      const url = config.url
      const groupId = url.substr(url.lastIndexOf('/') + 1)
      const { name, blocks } = JSON.parse(config.data)
      const getAvailable = async (groupId) => {
        const response = await fetch(`/mock/block/available/${(groupId % 2) + 1}.json`)
        return response.json()
      }

      const avaliableBlocks = await getAvailable(groupId)
      let result = []

      for (let i = 0; i < blockList.length; i++) {
        if (String(blockList[i].id) === groupId) {
          if (name) blockList[i].name = name
          if (blocks) {
            blockList[i].blocks = []
            avaliableBlocks.forEach((item) => {
              if (blocks.indexOf(item.id) > -1) {
                blockList[i].blocks.push(item)
              }
            })
          }
          result = blockList[i]

          break
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: result }])
        }, 500)
      })
    }
  },
  // 根据区块分组ID删除区块分组信息
  {
    url: /\/material-center\/api\/block-groups\/delete/,
    response: async (config) => {
      const url = config.url
      const groupId = url.substr(url.lastIndexOf('/') + 1)

      const group = blockList.splice(
        blockList.findIndex((item) => item.id === groupId),
        1
      )

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: group }])
        }, 500)
      })
    }
  },
  // 获取区块分组列表
  {
    url: /\/material-center\/api\/block-groups/,
    response() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: blockList }])
        }, 500)
      })
    }
  },
  // 创建区块
  {
    url: /\/material-center\/api\/block\/create/,
    response: async (config) => {
      const data = JSON.parse(config.data)

      // 创建需往数据库里插入信息
      data.id = String(++blockCount)
      arrData.push(data)

      const blockId = data.id
      if (blockId % 2) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data }])
          }, 2000) // 耗时较长
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '新建区块失败' } }])
        }, 500)
      })
    }
  },
  // 发布区块
  {
    url: /\/material-center\/api\/block\/deploy/,
    /*
    请求参数：
    {
      block,
      deploy_info: "修改button信息" 
    }
    */
    response: async (config) => {
      const data = JSON.parse(config.data)
      const blockId = data.block?.id
      if (blockId % 2) {
        const deploy = async () => {
          const response = await fetch(`/mock/block/deploy.json`)
          return response.json()
        }
        const deployData = await deploy()

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: deployData.data }])
          }, 500)
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '发布区块失败' } }])
        }, 500)
      })
    }
  },
  // 获取发布区块的进度信息
  {
    url: /\/material-center\/api\/tasks/,
    response: async (config) => {
      const url = config.url
      const taskId = url.substr(url.lastIndexOf('/') + 1)
      const deployProgress = async () => {
        const response = await fetch(`/mock/block/deployProgress.json`)
        return response.json()
      }
      const deployProgressRes = await deployProgress()

      // 区块Id不相等直接返回
      if (Number(taskId) !== deployProgressRes.data.id) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { error: { message: '查询区块进度失败' } }])
          }, 500)
        })
      }

      const FINISHED_PROGRESS = 100
      const INTERVAL_PROGRESS = 20

      // 判断发布状态
      const deployStatus = deployProgressRes.data.taskStatus

      // 如果构建状态为运行中：1, 返回构建进度条
      if (deployStatus === 1) {
        // 模拟后台进度更新, 每次查询进度更新增加20%
        deployProgressRes.data.progress_percent = blockProgress
        blockProgress += INTERVAL_PROGRESS

        if (blockProgress >= FINISHED_PROGRESS) {
          deployProgressRes.data.progress_percent = FINISHED_PROGRESS
          blockProgress = 0
        }
      }

      // 其它状态直接返回结果
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, deployProgressRes])
        }, 1000)
      })
    }
  },
  // 修改区块，同时创建区块备份记录/还原到某一历史备份
  {
    url: /\/material-center\/api\/block\/update/,
    response: async (config) => {
      const url = config.url
      const blockId = url.substr(url.lastIndexOf('/') + 1)
      const { current_history } = JSON.parse(config.data)

      // 消费侧-还原到某一历史备份
      if (current_history) {
        let block = null

        for (let i = 0; i < blockList.length; i++) {
          const blocks = blockList[i].blocks

          for (let i = 0; i < blocks.length; i++) {
            block = blocks[i]

            if (String(block.id) === blockId && block.current_history) {
              block.current_history.id = current_history

              break
            }
          }
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: block }])
          }, 500)
        })
      }

      // 只有奇数区块可以保存成功
      if (blockId % 2) {
        const block = JSON.parse(config.data)
        let blockData = null

        for (let i = 0; i < arrData.length; i++) {
          if (Number(arrData[i].id) === Number(blockId)) {
            blockData = arrData[i]

            Object.entries(block).forEach(([key, value]) => {
              blockData[key] = value
            })

            break
          }
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: blockData }])
          }, 1000)
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '保存区块失败' } }])
        }, 500)
      })
    }
  },
  // 区块管理 -- 获取区块列表
  {
    url: /\/material-center\/api\/block\/list/,
    proxy: '/mock/block/blockList.json',
    handleData({ data }) {
      if (arrData.length === 0) {
        arrData.push(...data)
        blockCount = arrData.length
      }

      return { data: arrData }
    }
  },
  // 区块管理 -- 删除区块
  {
    url: /\/material-center\/api\/block\/delete/,
    response(config) {
      const url = config.url
      const blockId = url.substr(url.lastIndexOf('/') + 1)
      let data = []

      // 只有 ID 为奇数的区块才能删除，否则抛出错误信息
      if (blockId % 2) {
        arrData.some((item, index) => {
          if (String(item.id) === blockId) {
            data = item
            arrData.splice(index, 1)
            return true
          }
          return false
        })

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data }])
          }, 500) // 耗时较短
        })
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { error: { message: '删除区块失败' } }])
        }, 500) // 耗时较短
      })
    }
  },
  // 根据区块ID获取区块历史备份列表
  {
    url: /\/material-center\/api\/block-history/,
    response: async (config) => {
      const url = config.url
      const query = url.substr(url.indexOf('?'))
      const params = new URLSearchParams(query)
      const block = params.get('block')

      if (!block) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: [] }])
          }, 1000)
        })
      }

      const historyList = async () => {
        const response = await fetch(`/mock/block/history.json`)
        return response.json()
      }

      const blockInfo = await historyList(block)

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: blockInfo }])
        }, 1000)
      })
    }
  },
  // 删除区块备份记录
  {
    url: /\/app-center\/api\/blockHistory\/delete/,
    response: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200])
        }, 1000)
      })
    }
  },
  // 根据区块备份记录还原区块信息
  {
    url: /\/app-center\/api\/blockHistory\/restore/,
    response: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200])
        }, 1000)
      })
    }
  },
  // 根据分组ID获取当前分组可以添加的区块
  {
    url: /\/material-center\/api\/block\/notgroup/,
    response: async (config) => {
      const url = config.url
      const groupId =
        url.indexOf('?') > -1
          ? url.substring(url.lastIndexOf('/') + 1, url.indexOf('?'))
          : url.substr(url.lastIndexOf('/') + 1)
      const query = url.substr(url.indexOf('?'))
      const params = new URLSearchParams(query)
      const value = params.get('label_contains')
      const author = params.getAll('author')
      const tenant = params.getAll('tenant')
      const tag = params.getAll('tag')

      if (!groupId) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: [] }])
          }, 500)
        })
      }

      const getAvailable = async (groupId) => {
        const response = await fetch(`/mock/block/available/${(groupId % 2) + 1}.json`)
        return response.json()
      }

      const blocks = await getAvailable(groupId)

      // 搜索结果
      const searchResult = value ? blocks.filter((item) => item.label.indexOf(value) > -1) : blocks
      // 标签过滤结果
      const tagResult =
        tag && tag.length ? searchResult.filter((item) => item.tags?.some((i) => tag.includes(i))) : searchResult
      // 组织过滤结果
      const tenantResult =
        tenant && tenant.length ? tagResult.filter((item) => tenant.includes(String(item.tenant?.id))) : tagResult
      // 作者过滤结果
      const authorResult =
        author && author.length ? tenantResult.filter((item) => author.includes(String(item.author?.id))) : tenantResult

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: authorResult }])
        }, 500)
      })
    }
  },
  // 获取区块所有标签
  {
    url: /\/material-center\/api\/block\/tags/,
    response: async () => {
      const getAvailable = async () => {
        const response = await fetch(`/mock/block/available/1.json`)
        return response.json()
      }

      const blocks = await getAvailable()
      const tags = []

      blocks &&
        blocks.forEach((block) => {
          block.tags && tags.push(...block.tags)
        })

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: Array.from(new Set(tags)) }])
        }, 500)
      })
    }
  },
  // 获取区块所有作者
  {
    url: /\/material-center\/api\/block\/users/,
    response: async () => {
      const getAvailable = async () => {
        const response = await fetch(`/mock/block/available/1.json`)
        return response.json()
      }

      const blocks = await getAvailable()
      const users = []

      blocks &&
        blocks.forEach((block) => {
          users.push(block.author)
        })

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: users }])
        }, 500)
      })
    }
  },
  // 获取区块所有组织
  {
    url: /\/material-center\/api\/block\/tenants/,
    response: async () => {
      const getAvailable = async () => {
        const response = await fetch(`/mock/block/available/1.json`)
        return response.json()
      }

      const blocks = await getAvailable()
      const tenants = []

      blocks &&
        blocks.forEach((block) => {
          block.tenant && tenants.push(block.tenant)
        })

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: tenants }])
        }, 500)
      })
    }
  },
  // 根据区块分组ID获取该分组下的区块列表
  {
    url: /\/material-center\/api\/block/,
    response(config) {
      const url = config.url
      const query = url.substr(url.indexOf('?'))
      const params = new URLSearchParams(query)
      const groupId = params.get('groups')
      const value = params.get('label_contains')
      let groupData = []

      for (let i = 0; i < blockList.length; i++) {
        if (String(blockList[i].id) === groupId) {
          groupData = blockList[i].blocks

          break
        }
      }

      groupData = value ? groupData.filter((item) => item.label.indexOf(value) > -1) : groupData

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: groupData }])
        }, 500)
      })
    }
  },
  // 数据源管理 -- 获取数据源列表
  {
    url: /api\/sources\/list/,
    response: async () => {
      const getDatasourceList = async () => {
        const response = await fetch('/mock/datasource.json')
        return response.json()
      }

      let { data } = await getDatasourceList()
      const index = data.findIndex((data) => data.id === tempObj?.id)

      if (index > -1) {
        data[index] = tempObj

        if (tempObj.status === 'delete') {
          data.splice(index, 1)
        }
      } else {
        if (tempObj) {
          tempObj.id = data.length + 1
          data = [...data, tempObj]
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: data }])
        }, 1000)
      })
    }
  },
  // 数据源管理 -- 新增数据源
  {
    url: /\/app-center\/api\/sources\/create/,
    response: async (config) => {
      tempObj = JSON.parse(config.data)

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: tempObj }])
        }, 1000)
      })
    }
  },
  // 数据源管理 -- 删除数据源
  {
    url: /\/app-center\/api\/sources\/delete/,
    response: async (config) => {
      const url = config.url
      const dataSourceId = url.substr(url.lastIndexOf('/') + 1)
      tempObj = { id: dataSourceId, status: 'delete' }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: tempObj }])
        }, 500)
      })
    }
  },
  // 数据源管理 -- 更新数据源
  {
    url: /\/app-center\/api\/sources\/update/,
    response: async (config) => {
      const addres = config.url.split('/')
      const id = Number(addres[addres.length - 1])

      // 提交需要更新的内容
      tempObj = JSON.parse(config.data)
      tempObj.id = id

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: tempObj }])
        }, 500)
      })
    }
  },
  // 数据源管理 -- 查询数据源详情
  {
    url: /api\/sources\/detail/,
    response: async (config) => {
      const addres = config.url.split('/')
      const id = addres[addres.length - 1]

      const getDataSourceDetail = async () => {
        const response = await fetch('/mock/datasource.json')
        return response.json()
      }

      const { data } = await getDataSourceDetail()
      let result = data.filter((item) => item.id === id)[0]

      if (tempObj && tempObj.id === id) {
        result = tempObj
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, { data: result }])
        }, 500)
      })
    }
  },
  // 数据源管理 -- 获取数据源模板列表
  {
    url: /\/app-center\/api\/source_tpl/,
    response: async () => {
      const getDataSourceTemplate = async () => {
        const response = await fetch('/mock/dataSourceTemplate.json')
        return response.json()
      }
      const templateData = await getDataSourceTemplate()

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, templateData])
        }, 500)
      })
    }
  },
  // 数据源管理 -- mock 用户输入的远程服务
  {
    url: /\.*api.*\/mock/,
    response: async () => {
      const getDataSourceTemplate = async () => {
        const response = await fetch('/mock/userService.json')
        return response.json()
      }
      const templateData = await getDataSourceTemplate()

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([200, templateData])
        }, 500)
      })
    }
  },
  {
    url: /ng-bundle\.json$/,
    proxy: 'mock/ng-bundle.json'
  },
  {
    url: '*',
    proxy: '*'
  }
]
