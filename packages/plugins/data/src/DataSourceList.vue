<template>
  <div class="data-source-list">
    <ul>
      <li v-for="key in filteredKey" :key="key" :class="['data-source-list-item', { selected: key === selectedKey }]">
        <div class="item-head">
          <div class="item-head-left">
            <span class="protocal"> {{ stateScope === STATE.CURRENT_STATE ? 'state.' : 'stores.' }}</span>
            <span class="name">{{ key }}</span>
          </div>
          <div class="item-head-right">
            <svg-button name="edit" tips="编辑" @click="openPanel(OPTION_TYPE.UPDATE, key)"></svg-button>
            <svg-button name="copy" tips="复制" @click="openPanel(OPTION_TYPE.COPY, key)"></svg-button>
            <svg-button name="delete" tips="删除" @click="confirmClick(key)"></svg-button>
          </div>
        </div>
      </li>
    </ul>
    <search-empty :isShow="!filteredKey.length" />
  </div>
</template>

<script lang="jsx">
import { computed } from 'vue'
import { useModal } from '@opentiny/tiny-engine-controller'
import { useResource } from '@opentiny/tiny-engine-controller'
import { findExpressionInAppSchema } from '@opentiny/tiny-engine-controller/js/ast'
import { constants } from '@opentiny/tiny-engine-utils'
import { SvgButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import { STATE, OPTION_TYPE } from './js/constants'

const { COMPONENT_NAME } = constants

export default {
  components: {
    SvgButton,
    SearchEmpty
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    query: {
      type: String,
      default: ''
    },
    stateScope: {
      type: String
    },
    selectedKey: {
      type: String
    }
  },
  emits: ['openPanel', 'remove', 'removeStore'],
  setup(props, { emit }) {
    const filteredKey = computed(() => props.modelValue.filter((key) => key.includes(props.query)))

    const openPanel = (flag, key) => {
      emit('openPanel', flag, key)
    }

    const removeConfirm = (key) => {
      useModal().confirm({
        title: '提示',
        message: `您确定要删除 ${key} 吗？`,
        exec: () => emit('remove', key)
      })
    }

    const removeStoreConfirm = (key) => {
      const appPages = useResource().resState.pageTree.filter(
        (page) => page.componentName === COMPONENT_NAME.Page && page?.meta?.group !== 'publicPages'
      )
      const expression = `stores.${key}`
      const expresstionPages = findExpressionInAppSchema(appPages, expression)

      if (expresstionPages.length > 0) {
        useModal().message({
          title: '提示',
          message: (
            <div>
              不允许删除，因为检查到 {expression} 在以下页面中被引用：
              {expresstionPages.map((pagaName) => (
                <div key={pagaName}>{pagaName}</div>
              ))}
            </div>
          )
        })
      } else {
        useModal().confirm({
          title: '提示',
          message: `您确定要删除 ${key} 吗？`,
          exec: () => emit('removeStore', key)
        })
      }
    }

    const confirmClick = (key) => {
      if (props.stateScope === STATE.CURRENT_STATE) {
        removeConfirm(key)
      } else {
        removeStoreConfirm(key)
      }
    }

    return {
      filteredKey,
      confirmClick,
      openPanel,
      STATE,
      OPTION_TYPE
    }
  }
}
</script>

<style lang="less" scoped>
.data-source-list {
  margin: 12px 0 0 0;
  overflow-y: scroll;
  .data-source-list-blank {
    font-size: 12px;
  }
  .data-source-list-item {
    &.selected,
    &:hover {
      background: var(--ti-lowcode-common-component-hover-bg);
    }
  }

  .item-head {
    height: 42px;
    padding: 0 10px;
    color: var(--ti-lowcode-data-list-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .item-head-left {
      display: flex;
      align-items: center;
      width: 70%;

      .tiny-svg {
        margin-right: 4px;
        cursor: pointer;
        transition: 0.3s;
        color: var(--ti-lowcode-toolbar-icon-color);
        flex-shrink: 0;

        &.is-expand {
          transform: rotate(90deg);
        }
      }

      .protocal {
        color: #5e7ce0;
        margin-right: 4px;
        font-size: 12px;
        flex-shrink: 0;
      }

      .remote {
        color: #3ac295;
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .item-head-right {
      display: flex;
      justify-content: flex-end;
      width: 30%;
      .svg-button {
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
        font-size: 14px;
        cursor: pointer;

        &:not(:last-child) {
          margin-right: 4px;
        }

        &:hover {
          color: var(--ti-lowcode-toolbar-icon-color);
        }
      }
    }
  }

  .item-content {
    padding: 0 8px;
    transition: 0.3s;
  }

  .content-item {
    p span {
      &:first-child {
        font-size: 14;
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
      }

      &:last-child {
        color: var(--ti-lowcode-dialog-font-color);
      }
    }
  }
  &-blank {
    color: var(--ti-lowcode-state-management-query-color);
    text-align: center;
    padding-top: 30px;
  }
}
</style>
