<template>
  <div v-show="menuState.show" ref="menuDom" class="context-menu" :style="menuState.position">
    <ul class="menu-item">
      <li
        v-for="(item, index) in menus"
        :key="index"
        :class="{
          'li-item': item.items,
          'li-item-disabled': actionDisabled(item)
        }"
        @click="doOperation(item)"
        @mouseover="onShowChildrenMenu(item)"
      >
        <div>
          <span>{{ item.name }}</span>
          <span v-if="item.items"><icon-right></icon-right></span>
        </div>
        <ul v-if="item.items && current === item" class="sub-menu menu-item" :style="subMenuStyles">
          <template v-for="(subItem, subIndex) in item.items" :key="subIndex">
            <li
              :class="[{ 'menu-item-disabled': subItem.check && !subItem.check?.() }]"
              @click.stop="doOperation(subItem)"
            >
              {{ subItem.name }}
            </li>
          </template>
        </ul>
      </li>
    </ul>
    <SaveNewBlock :boxVisibility="boxVisibility" fromCanvas @close="close"></SaveNewBlock>
  </div>
</template>

<script lang="jsx">
import { ref, reactive, nextTick } from 'vue'
import { canvasState, getConfigure, getController, getCurrent, copyNode, removeNodeById } from './container'
import { useLayout, useModal, useCanvas } from '@opentiny/tiny-engine-controller'
import { iconRight } from '@opentiny/vue-icon'

const menuState = reactive({
  position: null,
  show: false,
  menus: []
})

const current = ref(null)
const menuDom = ref(null)
const subMenuStyles = ref(null)

export const closeMenu = () => {
  menuState.show = false
  current.value = null
}

export const openMenu = (event) => {
  menuState.position = {
    left: event.clientX + 2 + 'px',
    top: event.clientY + 'px'
  }
  menuState.show = sessionStorage.getItem('pageInfo') ? true : false

  nextTick(() => {
    if (menuDom.value) {
      const { right, bottom, width, height } = menuDom.value.getBoundingClientRect()
      const canvasRect = canvasState.iframe.getBoundingClientRect()
      if (bottom > canvasRect.bottom) {
        menuState.position.top = `${parseInt(menuState.position.top) - height}px`
      }
      if (right > canvasRect.right) {
        menuState.position.left = `${parseInt(menuState.position.left) - width - 2}px`
      }
      // sub-menu样式width为100px，少于100宽度的空白区域则放置到左侧
      if (right + 100 < canvasRect.right) {
        subMenuStyles.value = { right: '-100px' }
      } else {
        subMenuStyles.value = { left: '-100px' }
      }
    }
  })
}

export default {
  components: {
    IconRight: iconRight()
  },
  setup(props, { emit }) {
    const menus = ref([
      { name: '修改属性', code: 'config' },
      {
        name: '插入',
        items: [
          { name: '向前', code: 'insert', value: 'top' },
          {
            name: '中间',
            code: 'insert',
            value: 'in',
            check() {
              const { componentName } = getCurrent()?.schema || {}
              return getConfigure(componentName)?.isContainer
            }
          },
          { name: '向后', code: 'insert', value: 'bottom' }
        ]
      },
      {
        name: '添加父级',
        items: [
          { name: '文字提示', code: 'wrap', value: 'TinyTooltip' },
          { name: '弹出框', code: 'wrap', value: 'TinyPopover' }
        ],
        code: 'addParent'
      },
      { name: '删除', code: 'del' },
      { name: '复制', code: 'copy' },
      { name: '绑定事件', code: 'bindEvent' },
      { name: '新建区块', code: 'createBlock' }
    ])

    const boxVisibility = ref(false)

    // 计算上下文菜单位置，右键时显示，否则关闭

    const operations = {
      del() {
        removeNodeById(getCurrent().schema?.id)
      },
      copy() {
        copyNode(getCurrent().schema?.id)
      },
      config() {
        useLayout().activeSetting('props')
      },
      bindEvent() {
        useLayout().activeSetting('event')
      },
      insert({ value }) {
        emit('insert', value)
      },
      wrap({ value, name }) {
        const componentName = value || name
        const { schema, parent } = getCurrent()

        if (!schema || !parent) {
          return
        }

        const index = parent.children.findIndex(({ id }) => schema.id === id)
        let wrapSchema = {
          componentName,
          id: null,
          props: {
            content: '提示信息'
          },
          children: [schema]
        }
        // 需要对popover特殊处理
        if (value === 'TinyPopover') {
          wrapSchema = {
            componentName,
            props: {
              width: 200,
              title: '弹框标题',
              trigger: 'manual',
              modelValue: true
            },
            children: [
              {
                componentName: 'Template',
                props: {
                  slot: 'reference'
                },
                children: [schema]
              },
              {
                componentName: 'Template',
                props: {
                  slot: 'default'
                },
                children: [
                  {
                    componentName: 'div',
                    props: {
                      placeholder: '提示内容'
                    }
                  }
                ]
              }
            ]
          }
        }
        parent.children.splice(index, 1, wrapSchema)
        getController().addHistory()
      },
      createBlock() {
        if (useCanvas().isSaved()) {
          boxVisibility.value = true
        } else {
          useModal().message({
            message: '请先保存当前页面',
            status: 'error'
          })
        }
      }
    }

    const actionDisabled = (actionItem) => {
      const actions = ['del', 'copy', 'addParent']
      return actions.includes(actionItem.code) && !getCurrent().schema?.id
    }

    const onShowChildrenMenu = (menuItem) => {
      current.value = !actionDisabled(menuItem) ? menuItem : null
    }

    const close = () => {
      boxVisibility.value = false
    }
    const doOperation = (item) => {
      if ((item.check && !item.check?.()) || actionDisabled(item)) {
        return
      }

      if (item?.code) {
        operations[item.code]?.(item)
        closeMenu()
      }
    }

    return {
      menuState,
      menus,
      doOperation,
      boxVisibility,
      close,
      current,
      menuDom,
      subMenuStyles,
      actionDisabled,
      onShowChildrenMenu
    }
  }
}
</script>

<style lang="less" scoped>
.context-menu {
  position: absolute;
  z-index: 10;
}
.menu-item {
  width: 140px;
  line-height: 20px;
  border-radius: 6px;
  padding: 8px 0;
  background-color: var(--ti-lowcode-canvas-menu-bg);
  box-shadow: 0 1px 15px 0 rgb(0 0 0 / 20%);
  display: flex;
  flex-direction: column;
  .li-item {
    border-bottom: 1px solid var(--ti-lowcode-canvas-menu-border-color);
  }
  .li-item-disabled {
    cursor: not-allowed;
    color: var(--ti-lowcode-canvas-menu-item-disabled-color);
  }
  li {
    & > div {
      display: flex;
      width: 100%;
      justify-content: space-between;
    }
    font-size: 12px;
    color: var(--ti-lowcode-canvas-menu-item-color);
    padding: 6px 15px;
    &:not(.menu-item-disabled):hover {
      background: var(--ti-lowcode-canvas-menu-item-hover-bg-color);
    }
    position: relative;

    &.menu-item-disabled {
      cursor: not-allowed;
      color: var(--ti-lowcode-canvas-menu-item-disabled-color);
    }
  }
  &.sub-menu {
    width: 100px;
    position: absolute;
    top: -2px;
  }
}
</style>
