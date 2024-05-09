<template>
  <div class="block-add-transfer">
    <div class="block-add-transfer-footer">
      <tiny-select v-model="state.selectedSort" class="transfer-order-select" placeholder="请选择">
        <tiny-option v-for="item in state.sortList" :key="item.id" :label="item.text" :value="item.id"></tiny-option>
      </tiny-select>
      <block-group-arrange v-model="state.displayType" :arrangeList="state.arrangeList"></block-group-arrange>
    </div>
    <div class="block-add-transfer-body">
      <block-group-transfer-panel
        title="可选区块列表"
        :selectedNums="state.blockList.length"
        :blockList="state.blockList"
        @check="leftCheck"
      ></block-group-transfer-panel>
      <block-group-transfer-panel
        title="已选区块列表"
        :selectedNums="state.selectedBlocks.length"
        :blockList="state.selectedBlocks"
        @check="rightCheck"
      ></block-group-transfer-panel>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, provide, reactive, watch } from 'vue'
import { useBlock, useModal } from '@opentiny/tiny-engine-controller'
import BlockGroupTransferPanel from './BlockGroupTransferPanel.vue'
import BlockGroupArrange from './BlockGroupArrange.vue'
import { Select, Option } from '@opentiny/vue'
import { fetchBlockById } from './http.js'

export default {
  components: {
    BlockGroupTransferPanel,
    BlockGroupArrange,
    TinySelect: Select,
    TinyOption: Option
  },
  props: {
    blockList: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const { cancelCheck, check, selectedBlockArray, sort } = useBlock()

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
      selectedBlocks: selectedBlockArray.value,
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

    const leftCheck = (block) => {
      // 添加区块时，默认添加区块最新版本
      if (!block.latestVersion) {
        fetchBlockById(block.id).then((blockDetail) => {
          const historyLength = blockDetail?.histories?.length || 0
          if (historyLength <= 0) {
            const { message } = useModal()
            message({ message: `${blockDetail.label}区块缺少历史记录，请重新发布区块`, status: 'error' })
          } else {
            block.latestVersion = blockDetail?.histories[historyLength - 1]?.version
            emit('update:blockList', check(state.blockList, block))
          }
        })
      } else {
        emit('update:blockList', check(state.blockList, block))
      }
    }

    const rightCheck = (block) => {
      const blockList = cancelCheck(state.blockList, block)

      emit('update:blockList', blockList)
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

    return {
      state,
      leftCheck,
      rightCheck
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
    padding: 10px;
    display: grid;
    grid-template-columns: 48% 48%;
    column-gap: 4%;
    overflow: hidden;
  }

  .block-add-transfer-footer {
    padding: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    column-gap: 12px;
    .transfer-order-select {
      width: 120px;
    }
    .footer-text {
      color: var(--ti-lowcode-toolbar-breadcrumb-color);
    }
  }
}
</style>
