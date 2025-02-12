<template>
  <tiny-select
    v-model="state.selected"
    value-field="id"
    render-type="tree"
    :tree-op="treeFolderOp"
    text-field="name"
    :clearable="true"
    popper-class="page-tree-select-dropdown"
    @change="handleChange"
  >
  </tiny-select>
</template>

<script setup lang="jsx">
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { Select as TinySelect } from '@opentiny/vue'
import { computed, defineEmits, defineProps, onMounted, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: () => ''
  }
})

const emit = defineEmits(['update:modelValue'])

const state = reactive({
  selected: props.modelValue?.name ?? ''
})

watch(
  () => props.modelValue?.name,
  (value) => {
    state.selected = value ?? ''
  }
)

const { pageSettingState, getPageList, STATIC_PAGE_GROUP_ID, COMMON_PAGE_GROUP_ID } = usePage()

const pages = computed(() =>
  pageSettingState.pages[STATIC_PAGE_GROUP_ID].data.concat(pageSettingState.pages[COMMON_PAGE_GROUP_ID].data)
)

onMounted(() => {
  if (!Array.isArray(pages.value)) {
    getPageList()
  }
})

const pageToTreeData = (page) => {
  const { id, name, isPage, children } = page

  // id 可能为数字，需要转换成字符串
  const result = { id: String(id), name, isPage, disabled: !isPage }

  if (Array.isArray(children)) {
    result.children = children.map((page) => pageToTreeData(page))
  }

  return result
}

const getNodeIcon = (data) => {
  if (data.id === pageSettingState.ROOT_ID) {
    return null
  }

  if (data.isPage) {
    return <SvgIcon name="text-page-common"></SvgIcon>
  }

  return <SvgIcon name="text-page-folder"></SvgIcon>
}

const treeFolderOp = computed(() => {
  const dummyRoot = pageToTreeData({ children: pages.value })
  const data = dummyRoot.children
  const options = {
    data: data,
    shrinkIcon: null,
    expandIcon: null,
    renderContent: (_h, { node, data }) => {
      return (
        <>
          {getNodeIcon(data)}
          <div>{node.label}</div>
        </>
      )
    }
  }

  return options
})

const handleChange = () => {
  emit('update:modelValue', { name: state.selected })
}
</script>

<style lang="less">
.tiny-select-dropdown.page-tree-select-dropdown {
  padding: 8px 0;

  .tiny-tree .tiny-tree-node__wrapper .tiny-tree-node {
    .tiny-tree-node__content {
      padding: 0;
      background-color: var(--te-configurator-common-bg-color);
      &:hover {
        background-color: var(--te-configurator-common-bg-color-hover);
      }
      // 移除子节点的的背景色，才能保证鼠标hover到.tiny-tree-node__content节点任意位置时，整行都有hover状态的背景色
      .tiny-tree-node__content-left,
      .tiny-tree-node__content-left .tiny-tree-node__content-box {
        background-color: unset;
        &:hover {
          background-color: unset;
        }
      }
      .tiny-tree-node__content-left {
        padding: 0;
        .tree-node-icon {
          margin: 0;
        }
        .tiny-tree-node__content-box {
          padding: 0 12px;
          svg {
            margin-right: 8px;
          }
        }
        .tiny-tree-node__label {
          font-size: 12px;
        }
      }
    }
    &.is-disabled > .tiny-tree-node__content .tiny-tree-node__content-box {
      color: var(--te-configurator-common-text-color-disabled);
    }
  }
}
</style>
