<template>
  <div class="add-button">
    <tiny-button @click="addProperty">
      <svg-icon name="add"></svg-icon>
      <span>添加</span>
    </tiny-button>
  </div>
  <meta-list-items :class="{ 'property-list': list.length }" :optionsList="list">
    <template #content="{ data }">
      <div :class="{ 'item-text': true }">
        {{ data.property }}
      </div>
    </template>
    <template #operate="{ data }">
      <svg-button name="to-edit" :hoverBgColor="false" @click="handleEdit(data)"></svg-button>
      <svg-button name="delete" :hoverBgColor="false" @click="del(data)"></svg-button>
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
  margin-top: 12px;
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
  :deep(.tiny-button) {
    padding: 0 12px;
    width: 66px;
    margin-right: 5px;
  }
}
</style>
