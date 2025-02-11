<template>
  <div>
    <h4 class="title">
      属性列表
      <tiny-popover
        placement="top"
        title=""
        trigger="hover"
        content="点击右侧创建按钮创建分组后，即可拖拽属性到指定分组内"
      >
        <template #reference>
          <div>
            <icon-help-circle class="help-icon"></icon-help-circle>
          </div>
        </template>
      </tiny-popover>
    </h4>
    <p v-if="!filterData.length" class="property-list-tips">请返回上一层，添加属性</p>
    <p v-else class="property-list-tips">将属性拖拽至右侧面板，完成分组</p>
    <ul ref="property" class="property-list">
      <li v-for="name in filterData" :key="name" :data-id="name" data-type="property" class="item">
        {{ name }}
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { Popover } from '@opentiny/vue'
import { iconHelpCircle } from '@opentiny/vue-icon'
import Sortable from 'sortablejs'
import store from '../store'

export default {
  components: {
    TinyPopover: Popover,
    IconHelpCircle: iconHelpCircle()
  },
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const property = ref(null)
    const newProp = ref(null)
    const group = ref(null)

    onMounted(() => {
      Sortable.create(property.value, {
        handle: '.item',
        group: {
          name: 'property'
        }
      })
    })

    const filterData = ref([])

    watch(
      () => props.data,
      (value) => {
        const attrs = []
        store.currentSchema.forEach(({ content }) => content.forEach(({ property }) => attrs.push(property)))
        filterData.value = value.filter((item) => attrs.indexOf(item) === -1)
      }
    )

    watch(
      () => store.currentSchema,
      (value) => {
        const attrs = []
        value.forEach(({ content }) => content.forEach(({ property }) => attrs.push(property)))
        filterData.value = props.data.filter((item) => attrs.indexOf(item) === -1)
      },
      { deep: true }
    )

    return {
      property,
      group,
      newProp,
      filterData
    }
  }
}
</script>

<style lang="less" scoped>
.title {
  margin: 20px 0;
}
.property-list-tips {
  font-size: 12px;
  color: var(--ti-lowcode-common-secondary-text-color);
}
.help-icon {
  margin-left: 3px;
  cursor: help;
  width: 14px;
  height: 14px;
}
.property-list {
  max-height: calc(var(--max-height) - 90px);
  overflow-y: auto;
}
.item {
  padding: 5px 10px;
  cursor: pointer;
  margin-bottom: 5px;
  color: #191919;
  padding: 7px 7px;
  list-style: none;
  border: 1px solid #e6e6e6;

  &:hover {
    background: var(--ti-lowcode-common-hover-bg-color);
  }
}
</style>
