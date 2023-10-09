<template>
  <div>
    <meta-list-items class="list" :optionsList="children">
      <template #content="{ data }">
        <div class="item-text">
          <div class="tiny-input">
            <input v-model="data.props.title" class="tiny-input__inner" />
          </div>
        </div>
      </template>
      <template #operate="{ data }">
        <tiny-tooltip class="item" effect="dark" content="删除" placement="top">
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
import { ref } from 'vue'
import MetaListItems from './MetaListItems.vue'
import { useProperties, useHistory } from '@opentiny/tiny-engine-controller'
import { utils } from '@opentiny/tiny-engine-utils'
import { iconDel } from '@opentiny/vue-icon'

export default {
  components: {
    MetaListItems,
    IconDel: iconDel()
  },
  setup() {
    const schemaChildren = useProperties().getSchema().children
    const componentName = schemaChildren?.[0]?.componentName

    schemaChildren.forEach((item) => {
      if (!item.props) {
        item.props = {
          title: '选项卡',
          name: ''
        }
      }
    })

    const children = ref(schemaChildren)
    const addChildren = () => {
      const name = utils.guid()

      schemaChildren.push({
        componentName,
        props: {
          title: '选项卡',
          name
        },
        children: [{ componentName: 'div' }]
      })
      children.value = [...schemaChildren]
    }

    const delChildren = (data) => {
      schemaChildren.splice(children.value.indexOf(data), 1)
      children.value = [...schemaChildren]
      useHistory().addHistory()
    }

    return { children, addChildren, delChildren }
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
