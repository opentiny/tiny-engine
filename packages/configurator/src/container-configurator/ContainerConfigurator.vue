<template>
  <div>
    <meta-list-items class="list" :optionsList="children" @dragEnd="dragEnd">
      <template #content="{ data }">
        <div class="item-text">
          <div class="tiny-input">
            <tiny-input v-model="data.props.title" @update:modelValue="onTitleUpdate(data)" />
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
    <div class="add-btn"><span @click="addChildren">+ 添加标签页</span></div>
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

    return { children, addChildren, delChildren, dragEnd, onTitleUpdate }
  }
}
</script>
<style lang="less" scoped>
.add-btn span {
  line-height: 26px;
  cursor: pointer;
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
</style>
