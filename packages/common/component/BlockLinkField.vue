<template>
  <tiny-popover class="block-link-field" popper-class="option-popper block-new-attr-popover">
    <template #reference>
      <span class="link-icon">+</span>
    </template>
    <ul class="context-menu">
      <li v-if="isLinked" class="menu-item" @click="unLink(data)">取消关联</li>
      <li v-else class="menu-item" @click="addProperty(data)">+ 新建属性</li>
      <li class="menu-item" @click="openBlockSetting">管理属性</li>
      <li v-for="item in properties" :key="item.property" class="menu-item">
        {{ item.property }}
        <span v-if="item.property !== data?.linked?.blockProperty" class="link-item" @click="editProperty(item)">
          关联
        </span>
      </li>
    </ul>
  </tiny-popover>
</template>

<script lang="jsx">
import { reactive, computed } from 'vue'
import { extend } from '@opentiny/vue-renderless/common/object'
import { Input as TinyInput, Popover as TinyPopover } from '@opentiny/vue'
import { useLayout, useModal, useCanvas, useBlock, useHistory } from '@opentiny/tiny-engine-controller'

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
    const { pageState, canvasApi } = useCanvas()
    const { addBlockProperty, removePropertyLink, getCurrentBlock, editBlockProperty } = useBlock()
    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { schema } = canvasApi.value.getSchema?.() || {}

    const state = reactive({
      newPropertyName: ''
    })

    const properties = schema?.properties?.[0]?.content || []
    const isLinked = computed(() => Boolean(props.data.linked))

    const addProperty = (property) => {
      state.newPropertyName = ''

      confirm({
        title: '新建区块属性',
        status: 'custom',
        message: {
          render() {
            return (
              <div>
                <div>此新字段将自动链接到此属性</div>
                <br />
                <TinyInput placeholder="请输入字段名称" v-model={state.newPropertyName}></TinyInput>
              </div>
            )
          }
        },
        exec() {
          const {
            schema: { id, componentName }
          } = canvasApi.value?.getCurrent?.() || {}
          const newProperty = extend(true, {}, property, {
            property: state.newPropertyName || `${property.property}${id}`,
            linked: {
              id,
              componentName,
              property: property.property
            }
          })

          addBlockProperty(newProperty, getCurrentBlock())
          useHistory().addHistory()
        }
      })
    }

    const editProperty = (property) => {
      const {
        schema: { id, componentName }
      } = canvasApi.value?.getCurrent?.() || {}

      // 如果之前有关联关系，则需要去除关联
      if (props.data?.linked) {
        removePropertyLink({ componentProperty: props.data })
      }

      property.linked = {
        id,
        componentName,
        property: props.data.property
      }

      const linked = props.data.linked || {}
      Object.assign(linked, { ...property.linked, blockProperty: property.property })
      Object.assign(props.data, { linked })

      editBlockProperty(property, props.data)
      useHistory().addHistory()
    }

    const openBlockSetting = () => {
      activePlugin(PLUGIN_NAME.BlockManage).then((api) => {
        api.openSettingPanel({ item: getCurrentBlock() })
      })
    }

    const unLink = (property) => {
      confirm({
        title: '提示',
        message: '您确定要取消关联吗?',
        exec: () => {
          const componentId = pageState?.currentSchema?.id

          if (componentId) {
            removePropertyLink({ componentProperty: property })
            useHistory().addHistory()
          }
        }
      })
    }

    return {
      state,
      isLinked,
      unLink,
      addProperty,
      editProperty,
      properties,
      openBlockSetting
    }
  }
}
</script>
<style lang="less" scoped>
.link-icon {
  width: 16px;
  height: 16px;
  margin: 0 5px;
  border-radius: 50%;
  line-height: 16px;
  text-align: center;
  color: var(--ti-lowcode-block-link-field-link-icon-color);
  background-color: var(--ti-lowcode-block-link-field-link-icon-bg-color);
  cursor: pointer;
  &:hover {
    transform: scale(1.2);
  }
}

.context-menu {
  width: 200px;
  padding: 3px 0;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  .menu-item {
    color: var(--ti-lowcode-attr-popover-menu-item-color);
    display: flex;
    justify-content: space-between;
    padding: 6px 15px;
    cursor: pointer;
    &:hover {
      background: var(--ti-lowcode-attr-popover-menu-item-hover-bg-color);
    }

    .link-item {
      cursor: pointer;
      background-color: var(--ti-lowcode-attr-popover-menu-item-link-item-bg-color);
      color: var(--ti-lowcode-attr-popover-menu-item-link-item-color);
      padding: 2px 6px;
      border-radius: 2px;
    }
  }
}
</style>
<style lang="less">
.tiny-popover.tiny-popper.block-new-attr-popover {
  // 这里不知为啥要添加 max-height，后续确认无用可删除
  max-height: 65vh;
  padding: 0;
}
</style>
