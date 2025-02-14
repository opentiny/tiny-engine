<template>
  <tiny-popover class="block-link-field" popper-class="option-popper block-new-attr-popover" :visible-arrow="false">
    <template #reference>
      <div>
        <span class="icon-wrap bind-prop">
          <svg-icon name="block-bind-prop"></svg-icon>
        </span>
        <span class="icon-wrap add-prop">
          <svg-icon name="block-add-prop"></svg-icon>
        </span>
      </div>
    </template>
    <ul class="context-menu">
      <li v-if="isLinked" class="menu-item" @click="unLink(data)">取消关联</li>
      <li v-else class="menu-item" @click="addProperty(data)">
        <svg-icon name="plus-circle"></svg-icon>
        <span>创建并链接新属性</span>
      </li>
      <li class="menu-item" @click="openBlockSetting">
        <svg-icon name="setting"></svg-icon>
        <span>打开属性面板</span>
      </li>
      <li v-for="item in properties" :key="item.property" class="menu-item property">
        <span>{{ item.property }}</span>
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
import { useLayout, useModal, useCanvas, useBlock, useHistory } from '@opentiny/tiny-engine-meta-register'

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
    const { pageState, canvasApi, getSchema } = useCanvas()
    const { addBlockProperty, removePropertyLink, getCurrentBlock, editBlockProperty } = useBlock()
    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { schema } = getSchema?.() || {}

    const state = reactive({
      newPropertyName: ''
    })

    const properties = schema?.properties?.[0]?.content || []
    const isLinked = computed(() => Boolean(props.data.linked))

    const addProperty = (property) => {
      state.newPropertyName = ''

      confirm({
        title: '属性名称',
        message: {
          render() {
            return (
              <div>
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
.icon-wrap {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  color: var(--te-component-common-block-add-text-color);

  .svg-icon {
    font-size: 14px;
  }

  &:hover .svg-icon {
    transform: scale(1.25);
  }

  &.bind-prop {
    z-index: 30;
    &:hover {
      z-index: 10;
    }
  }

  &.add-prop {
    z-index: 20;
    &:hover {
      z-index: 30;
    }
  }
}

.context-menu {
  width: 200px;
  padding: 8px 0;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  .menu-item {
    line-height: 18px;
    color: var(--te-component-common-text-color-primary);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    cursor: pointer;
    &:hover {
      background: var(--te-component-common-bg-color-hover);
    }
    &.property {
      justify-content: space-between;
    }
    .link-item {
      cursor: pointer;
      color: var(--te-component-common-text-color-emphasize);
    }
  }

  .svg-icon {
    font-size: 16px;
  }
}
</style>
<style lang="less">
.tiny-popover.tiny-popper.tiny-popper.block-new-attr-popover[x-placement] {
  // 这里不知为啥要添加 max-height，后续确认无用可删除
  max-height: 65vh;
  padding: 0;
}
</style>
