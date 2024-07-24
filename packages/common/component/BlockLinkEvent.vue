<template>
  <tiny-popover popper-class="quick">
    <template #reference>
      <span class="link-icon">+</span>
    </template>
    <ul class="context-menu">
      <li v-if="isLinked" class="menu-item" @click="unLink(data.linkedEventName)">取消关联</li>
      <li v-else class="menu-item" @click="addEvent(data)">+ 新建事件</li>
      <li class="menu-item" @click="openBlockSetting">管理事件</li>
      <li v-for="item in eventsList" :key="item.name" class="menu-item">
        {{ item.name }}
        <span v-if="item.name !== data?.linkedEventName" class="link-item" @click="editEvent(item, data)">关联</span>
      </li>
    </ul>
  </tiny-popover>
</template>

<script lang="jsx">
import { reactive, computed } from 'vue'
import { capitalize } from '@vue/shared'
import { extend } from '@opentiny/vue-renderless/common/object'
import { Input as TinyInput, Form as TinyForm, FormItem as TinyFormItem, Popover as TinyPopover } from '@opentiny/vue'
import { useLayout, useModal, useCanvas, useBlock } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyPopover
  },
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const { confirm } = useModal()
    const { pageState } = useCanvas()
    const { addBlockEvent, removeEventLink, getCurrentBlock, appendEventEmit } = useBlock()
    const { PLUGIN_NAME, activePlugin } = useLayout()

    const { schema } = useCanvas().canvasApi.value?.getSchema?.() || {}
    const events = schema?.events || []
    const eventsList = Object.entries(events).map(([key, value]) => {
      return {
        name: key,
        ...value
      }
    })
    const isLinked = computed(() => Boolean(props.data.linked))

    const addEvent = (data) => {
      const formData = reactive({
        name: ''
      })
      const pattern = /^[A-Za-z]\w*?\w$/
      const rules = {
        name: [{ pattern, message: '首字符为字母, 其它是单字字符' }]
      }

      let name = ''

      const changeName = (value) => {
        name = value
      }

      confirm({
        title: '新建区块事件',
        status: 'custom',
        message: {
          render() {
            return (
              <div>
                <div>此新区块事件将自动链接到此组件事件</div>
                <br />
                <TinyForm show-message label-width="0" model={formData} rules={rules}>
                  <TinyFormItem prop="name">
                    <TinyInput v-model={formData.name} placeholder="请输入事件名" onChange={changeName}></TinyInput>
                  </TinyFormItem>
                </TinyForm>
              </div>
            )
          }
        },
        exec() {
          if (!pattern.test(name)) {
            return
          }

          const {
            schema: { id, componentName }
          } = useCanvas().canvasApi.value?.getCurrent?.() || {}

          const newEvent = extend(true, {}, data.metaEvent, {
            linked: {
              id,
              componentName,
              event: data.eventName
            }
          })

          addBlockEvent(
            {
              name: `on${capitalize(name.replace(/^on/i, ''))}`,
              event: newEvent
            },
            getCurrentBlock()
          )

          appendEventEmit({
            eventName: name,
            functionName: data.ref
          })
        }
      })
    }

    const editEvent = (item, data) => {
      const {
        schema: { id, componentName }
      } = useCanvas().canvasApi.value?.getCurrent?.() || {}

      const oldEventName = data.linkedEventName

      if (oldEventName) {
        removeEventLink(data.linkedEventName)
      }

      const newEvent = extend(true, {}, data.metaEvent, {
        linked: {
          id,
          componentName,
          event: data.eventName
        }
      })

      addBlockEvent(
        {
          name: item.name,
          event: newEvent
        },
        getCurrentBlock()
      )

      appendEventEmit({
        eventName: item.name,
        functionName: data.ref
      })
    }

    const openBlockSetting = () => {
      activePlugin(PLUGIN_NAME.BlockManage).then((api) => {
        api.openSettingPanel({ item: getCurrentBlock() })
      })
    }

    const unLink = (linkedEventName) => {
      confirm({
        title: '提示',
        message: '您确定要取消关联吗?',
        exec: () => {
          const componentId = pageState?.currentSchema?.id

          if (componentId) {
            removeEventLink(linkedEventName)
          }
        }
      })
    }

    return {
      isLinked,
      unLink,
      addEvent,
      editEvent,
      eventsList,
      openBlockSetting
    }
  }
}
</script>

<style lang="less" scoped>
.link-icon {
  padding: 0 3px;
  margin: 0 5px;
  color: #fff;
  border-radius: 50%;
  line-height: 14px;
  background-color: var(--ti-lowcode-description-color);
  &:hover {
    cursor: pointer;
    transform: scale(1.3);
  }
}

.context-menu {
  width: 200px;
  padding: 3px 0;
  border: 1px solid var(--ti-lowcode-tabs-border-color);
  border-radius: 3px;
  background-color: var(--ti-lowcode-toolbar-view-hover-bg);
  box-shadow: 0 1px 15px 0 rgb(0 0 0 / 20%);
  display: flex;
  flex-direction: column;
  .menu-item {
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    padding: 6px 15px;
    &:not(:last-child) {
      border-bottom: 1px solid var(--ti-lowcode-tabs-border-color);
    }
    &:hover {
      color: var(--ti-lowcode-toolbar-icon-color);
      background: var(--ti-lowcode-canvas-wrap-bg);
    }

    .link-item {
      cursor: pointer;
      background-color: var(--ti-lowcode-icon-bind-color);
      padding: 2px 5px;
    }
  }
}
</style>
