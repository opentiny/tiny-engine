<template>
  <!-- 导航属性配置 -->
  <div>
    <div class="tabs-header">
      <div>标签栏项</div>
    </div>
    <meta-list-items class="list" :optionsList="children" @dragEnd="dragEnd">
      <template #content="{ data }">
        <div class="item-text">
          <div class="tiny-input">
            <tiny-input
              v-if="data.children"
              v-model="data.children[1].props.text"
              @update:modelValue="onTitleUpdate(data)"
            />
            <tiny-input v-else v-model="data.props.text" @update:modelValue="onTitleUpdate(data)" />
          </div>
        </div>
      </template>
      <template #operate="{ data }">
        <tiny-tooltip class="item" effect="light" content="删除" placement="top">
          <span class="item-icon">
            <svg-icon name="delete" @click="delChildren(data)"></svg-icon>
          </span>
        </tiny-tooltip>
      </template>
    </meta-list-items>
    <div class="bottom">
      <div class="add-btn" @click="addChildren">
        <svg-icon name="add"></svg-icon>
        <span>新增一项</span>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue'
import { Input } from '@opentiny/vue'
import { MetaListItems } from '@opentiny/tiny-engine-common'
import { useProperties, useMaterial, useHistory, useCanvas } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    MetaListItems,
    TinyInput: Input
  },
  setup() {
    const { children: schemaChildren, componentName } = useProperties().getSchema()
    const configureMap = useMaterial().getConfigureMap()
    const childComponentName =
      configureMap[componentName]?.nestingRule?.childWhitelist?.[0] || schemaChildren?.[0]?.componentName
    const hasChildren = schemaChildren?.[0]?.children

    const updateChildrenToValid = () => {
      const schema = useProperties().getSchema()
      const schemaChildren = schema.children || []
      let hasUpdate = false

      const newChildren = schemaChildren.map((item) => {
        if (!item.props) {
          hasUpdate = true

          item.props = {
            text: '选项标题',
            iconPath: 'https://tinyengine-assets.obs.cn-north-4.myhuaweicloud.com/files/harmony/images/tabbar/home.svg'
          }
        }

        return item
      })

      const { operateNode } = useCanvas()

      if (hasUpdate) {
        operateNode({ type: 'updateAttributes', id: schema.id, value: { children: newChildren } })
      }
    }

    onMounted(() => {
      updateChildrenToValid()
    })

    const children = ref(schemaChildren)
    const addChildren = () => {
      const schema = useProperties().getSchema()
      const newNodeData = hasChildren
        ? {
            componentName: childComponentName,
            props: {
              to: '',
              style: 'display: inline-flex; gap: 8px; padding: 10px 20px; color: inherit; text-decoration: none;'
            },
            children: [
              {
                componentName: 'Icon',
                props: {
                  name: 'IconPublicHome',
                  style: 'margin-top: 3px;'
                }
              },
              {
                componentName: 'Text',
                props: {
                  text: '标签栏项'
                }
              }
            ]
          }
        : {
            componentName: childComponentName,
            props: {
              text: '标签栏项',
              iconPath:
                'https://tinyengine-assets.obs.cn-north-4.myhuaweicloud.com/files/harmony/images/tabbar/home.svg'
            }
          }

      const { operateNode } = useCanvas()

      operateNode({ type: 'insert', parentId: schema.id, newNodeData, position: 'after' })

      children.value = [...schemaChildren]
    }

    const delChildren = (data) => {
      const { operateNode } = useCanvas()

      operateNode({ type: 'delete', id: data.id })

      children.value = [...schemaChildren]

      useHistory().addHistory()
    }

    const dragEnd = (params = {}) => {
      const { oldIndex, newIndex } = params?.moved || {}

      if (oldIndex === undefined || newIndex === undefined) {
        return
      }

      const schema = useProperties().getSchema()
      const schemaChildren = schema.children

      const { operateNode } = useCanvas()

      const newNodeData = schemaChildren[oldIndex]
      const referTargetNodeId = schemaChildren[newIndex].id

      operateNode({ type: 'delete', id: schemaChildren[oldIndex].id })
      operateNode({
        type: 'insert',
        parentId: schema.id,
        newNodeData,
        position: newIndex < oldIndex ? 'before' : 'after',
        referTargetNodeId
      })

      children.value = [...schemaChildren]
    }

    const onTitleUpdate = (value) => {
      const { operateNode } = useCanvas()
      const id = value.id

      operateNode({ type: 'changeProps', id, value: { props: value.props } })
    }

    return { children, addChildren, delChildren, dragEnd, onTitleUpdate, componentName }
  }
}
</script>
<style lang="less" scoped>
.bottom {
  display: flex;
  align-items: center;
}
.add-btn {
  display: flex;
  align-items: center;
  color: var(--te-configurator-common-text-color-emphasize);
  margin-top: 4px;
  &:hover {
    cursor: pointer;
  }

  & .svg-icon {
    margin-right: 4px;
  }
}
.item-icon {
  display: flex;
  align-items: center;
  height: 100%;
  color: var(--te-configurator-common-icon-color);
  .svg-icon {
    font-size: 14px;
  }
}
:deep(.item-content .option-input) {
  height: auto;
}
.item-text {
  margin: 4px 0;
  .tiny-input {
    display: inline-flex;
    gap: 4px;
  }
}
.tabs-header {
  display: inline-flex;
  align-items: center;
  padding-left: 22px;
  gap: 4px;
  height: 24px;
  color: var(--te-configurator-common-text-color-secondary);
  background-color: var(--te-configurator-tab-bar-bg-color);
  width: 100%;
  & > div {
    width: calc(50% - 14px);
  }
  .tabs-header-id {
    position: relative;
    &::before {
      content: '';
      position: absolute;
      left: -7px;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 10px;
      background-color: var(--te-configurator-tab-bar-border-color-divider);
    }
  }
}
</style>
