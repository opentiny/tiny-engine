<template>
  <div class="add-button">
    <tiny-button @click="addProperty">
      <span>添加</span>
    </tiny-button>
  </div>
  <meta-list-items class="property-list" :optionsList="list">
    <template #content="{ data }">
      <div :class="{ 'item-text': true }">
        {{ data.property }}
      </div>
    </template>
    <template #operate="{ data }">
      <svg-button name="edit" tips="编辑" placement="top" @click="handleEdit(data)"></svg-button>
      <svg-button name="delete" tips="删除" placement="top" @click="del(data)"></svg-button>
    </template>
  </meta-list-items>
</template>

<script>
import { computed } from 'vue'
import { Button as TinyButton } from '@opentiny/vue'
import { remove } from '@opentiny/vue-renderless/common/array'
import { MetaListItems, SvgButton } from '@opentiny/tiny-engine-common'
import {
  getEditBlockPropertyList,
  setEditProperty,
  addBlockCustomProperty,
  getEditProperty,
  getEditBlock
} from './js/blockSetting'

export default {
  components: {
    TinyButton,
    SvgButton,
    MetaListItems
  },
  setup() {
    const list = computed(() => getEditBlockPropertyList() || [])
    const currentProperty = computed(() => getEditProperty() || {})
    const del = (data) => {
      remove(getEditBlockPropertyList(), data)
    }

    const addProperty = () => {
      addBlockCustomProperty()
    }

    const handleEdit = (data) => {
      setEditProperty(data)
    }

    return {
      list,
      del,
      addProperty,
      currentProperty,
      properties: getEditBlock()?.content?.schema?.properties,
      handleEdit
    }
  }
}
</script>

<style lang="less" scoped>
.property-list {
  max-height: 222px;
  overflow-y: auto;
  padding: 1px 0; // 解决因为子元素加上了border之后，在高度小于222px之前高度永远>property-list, 导致滚动条一直出现的问题
  margin-bottom: 8px;
}

.item-text {
  flex: 1;
}

.item-icon {
  cursor: pointer;
  padding: 2px;
}
.item-icon + .item-icon {
  margin-left: 8px;
}

.add-button {
  display: flex;
  padding-bottom: 16px;
  :deep(.tiny-button) {
    margin-right: 5px;
  }
  .plus-icon {
    width: 16px;
    height: 16px;
  }
  .editorWarp {
    display: inline-block;
  }
}
</style>
