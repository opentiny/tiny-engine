<template>
  <div>
    <div class="tabs-header">
      <div>页签标题</div>
      <div class="tabs-header-id">页签值</div>
    </div>
    <meta-list-items class="list" :optionsList="children" @dragEnd="dragEnd">
      <template #content="{ data }">
        <div class="item-text">
          <div class="tiny-input">
            <tiny-input v-model="data.props.title" @update:modelValue="onTitleUpdate(data)" />
            <tiny-input v-model="data.props.name" @update:modelValue="onTitleUpdate(data)" />
          </div>
        </div>
      </template>
      <template #operate="{ data }">
        <tiny-tooltip class="item" effect="light" content="删除" placement="top">
          <span class="item-icon">
            <icon-del @click="delChildren(data)"></icon-del>
          </span>
        </tiny-tooltip>
      </template>
    </meta-list-items>
    <div class="bottom">
      <div class="add-btn" @click="addChildren">
        <svg-icon name="add"></svg-icon>
        <span>添加标签页</span>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue'
import { Input } from '@opentiny/vue'
import { MetaListItems } from '@opentiny/tiny-engine-common'
import { useProperties, useMaterial, useHistory, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { iconDel } from '@opentiny/vue-icon'

export default {
  components: {
    MetaListItems,
    IconDel: iconDel(),
    TinyInput: Input
  },
  setup() {
    const { children: schemaChildren, componentName } = useProperties().getSchema()
    const configureMap = useMaterial().getConfigureMap()
    const childComponentName =
      configureMap[componentName]?.nestingRule?.childWhitelist?.[0] || schemaChildren?.[0]?.componentName

    const updateChildrenToValid = () => {
      const schema = useProperties().getSchema()
      const schemaChildren = schema.children || []
      let hasUpdate = false

      const newChildren = schemaChildren.map((item) => {
        if (!item.props) {
          hasUpdate = true

          item.props = {
            title: '选项卡',
            name: ''
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
      const name = utils.guid()
      const schema = useProperties().getSchema()
      const newNodeData = {
        componentName: childComponentName,
        props: {
          title: '选项卡',
          name
        },
        children: [{ componentName: 'div' }]
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
  svg {
    margin-left: 4px;
    cursor: pointer;
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
  background-color: var(--te-configurator-container-bg-color);
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
      background-color: var(--te-configurator-container-border-color-divider);
    }
  }
}
</style>
