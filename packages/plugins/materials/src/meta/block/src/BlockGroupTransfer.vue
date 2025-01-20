<template>
  <div class="block-add-transfer">
    <div class="block-add-transfer-footer">
      <select-all
        v-if="state.displayType === 'grid'"
        class="block-select-all"
        :allItems="state.blockList"
        :selected="selectedBlockArray"
        @select-all="handleSelectAll"
      ></select-all>
      <slot name="search"></slot>
      <tiny-select v-model="state.selectedSort" class="transfer-order-select" placeholder="请选择">
        <tiny-option v-for="item in state.sortList" :key="item.id" :label="item.text" :value="item.id"></tiny-option>
      </tiny-select>
      <block-group-arrange v-model="state.displayType" :arrangeList="state.arrangeList"></block-group-arrange>
    </div>
    <div class="block-add-transfer-body">
      <block-list
        v-bind="$attrs"
        :blockList="state.blockList"
        :trigger-check="true"
        :show-block-shot="false"
        :showSettingIcon="false"
        :show-checkbox="true"
        :checked="selectedBlockArray"
        :grid-columns="6"
        @check="checkBlock"
        @checkAll="checkAll"
        @cancelCheckAll="cancelCheckAll"
      ></block-list>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, provide, reactive, watch } from 'vue'
import { useBlock, useModal } from '@opentiny/tiny-engine-meta-register'
import { SelectAll } from '@opentiny/tiny-engine-common'
import BlockList from './BlockList.vue'
import BlockGroupArrange from './BlockGroupArrange.vue'
import { Select, Option } from '@opentiny/vue'
import { fetchBlockById } from './http.js'

export default {
  components: {
    BlockList,
    BlockGroupArrange,
    SelectAll,
    TinySelect: Select,
    TinyOption: Option
  },
  props: {
    blockList: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const { check, cancelCheck, checkAll, cancelCheckAll, selectedBlockArray, sort } = useBlock()

    const sortList = [
      {
        id: 'timeDesc',
        text: '按时间倒序'
      },
      {
        id: 'timeAsc',
        text: '按时间顺序'
      },
      {
        id: 'alphabetAsc',
        text: '按字母顺序'
      },
      {
        id: 'alphabetDesc',
        text: '按字母倒序'
      }
    ]
    const arrangeList = [
      {
        id: 'grid',
        name: '栅格',
        svgName: 'grid'
      },
      {
        id: 'mini',
        name: '列表',
        svgName: 'small-list'
      }
    ]
    const state = reactive({
      displayType: 'grid',
      selectedSort: sortList[0].id,
      blockList: props.blockList,
      sortList,
      arrangeList
    })

    provide(
      'displayType',
      computed(() => state.displayType)
    )

    const blockSort = (type) => {
      state.blockList = sort(state.blockList, type)
    }

    const checkBlock = (block) => {
      if (selectedBlockArray.value.some((item) => item.id === block.id)) {
        cancelCheck(block)
        return
      }

      // 添加区块时，默认添加区块最新版本
      if (!block.latestVersion) {
        fetchBlockById(block.id).then((blockDetail) => {
          const historyLength = blockDetail?.histories?.length || 0
          if (historyLength <= 0) {
            const { message } = useModal()
            message({ message: `${blockDetail.label}区块缺少历史记录，请重新发布区块`, status: 'error' })
          } else {
            block.latestVersion = blockDetail?.histories[historyLength - 1]?.version
            check(block)
          }
        })
      } else {
        check(block)
      }
    }

    watch(
      () => props.blockList,
      (value) => {
        state.blockList = value
        blockSort(state.selectedSort)
      }
    )

    watch(
      () => state.selectedSort,
      (value) => {
        blockSort(value)
      }
    )

    onMounted(() => {
      blockSort(state.selectedSort)
    })

    const handleSelectAll = (items) => {
      if (Array.isArray(items)) {
        checkAll(items)
      } else {
        cancelCheckAll()
      }
    }

    return {
      state,
      selectedBlockArray,
      checkBlock,
      checkAll,
      cancelCheckAll,
      handleSelectAll
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-transfer {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 232px);

  .block-add-transfer-body {
    min-height: calc(100% - 42px);
    margin-top: 12px;
    overflow-y: auto;
  }

  .block-add-transfer-footer {
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .block-select-all {
      margin-right: 20px;
    }
    .transfer-order-select {
      width: 120px;
      margin-left: 8px;
    }
    .footer-text {
      color: var(--te-common-text-secondary);
    }
  }
}
</style>
