<template>
  <div class="bind-action-list">
    <div class="popover-head">
      <tiny-popover
        popperClass="option-popper setting-advanced-bind-event-list"
        placement="bottom-start"
        trigger="hover"
        class="bind-action-button-item"
        width="256"
        :visible-arrow="false"
      >
        <template #reference>
          <tiny-button class="bind-event-btn">
            <span>绑定事件</span>
            <icon-chevron-down class="icon-chevron-down bind-event-btn-icon"></icon-chevron-down>
          </tiny-button>
        </template>
        <ul class="bind-event-list">
          <li
            v-for="(event, name) in renderEventList"
            :key="name"
            :class="['bind-event-list-item', { 'bind-event-list-item-notallow': state.bindActions[name] }]"
            @click="openActionDialog({ eventName: name }, true)"
          >
            <div>{{ name }}&nbsp; | &nbsp;{{ event?.label?.[locale] || name }}</div>
          </li>
        </ul>
      </tiny-popover>
      <tiny-button
        class="title add-custom-event-button bind-action-button-item"
        @click="handleToggleAddEventDialog(true)"
      >
        <svg-icon name="add" class="custom-event-button-icon"></svg-icon>
        <span class="custom-event-button-text">添加新事件</span>
      </tiny-button>
    </div>
    <ul v-show="!isEmpty" class="bind-actions">
      <li v-for="action in state.bindActions" :key="action.eventName">
        <div class="action-item bind-action-item">
          <div class="binding-name" @click="openActionDialog(action)">
            <div>
              {{ action.eventName }}<span>{{ renderEventList[action.eventName]?.label?.[locale] }}</span>
            </div>
            <div :class="{ linked: action.linked }">{{ action.linkedEventName }}</div>
            <span class="event-bind">{{ action.ref }}</span>
          </div>
          <div class="action-buttons">
            <block-link-event v-if="isBlock" :data="action"></block-link-event>
            <svg-button
              name="plugin-icon-page-schema"
              tips="定位到代码"
              placement="top"
              :hoverBgColor="false"
              @click="openCodePanel(action)"
            ></svg-button>
            <svg-button name="setting" :hoverBgColor="false" @click="openActionDialog(action, false)"></svg-button>
            <svg-button name="delete" :hoverBgColor="false" @click="delEvent(action)"></svg-button>
          </div>
        </div>
      </li>
    </ul>
    <div v-show="isEmpty" class="empty-action">
      <div class="icon">
        <svg-icon name="empty-action" class="empty-action-icon"></svg-icon>
      </div>
      <div class="center">支持添加原生DOM事件，然后点击 绑定事件 为画布所选元素增加事件</div>
    </div>
  </div>
  <bind-events-dialog :eventBinding="state.eventBinding"></bind-events-dialog>
  <add-events-dialog
    :visible="state.showBindEventDialog"
    :componentEvents="renderEventList"
    @closeDialog="handleToggleAddEventDialog(false)"
    @addEvent="handleAddEvent"
  ></add-events-dialog>
</template>

<script>
import { computed, reactive, watchEffect } from 'vue'
import { Popover, Button } from '@opentiny/vue'
import {
  useModal,
  getMergeMeta,
  useCanvas,
  useLayout,
  useBlock,
  useMaterial,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'
import i18n from '@opentiny/tiny-engine-common/js/i18n'
import { BlockLinkEvent, SvgButton } from '@opentiny/tiny-engine-common'
import { iconChevronDown } from '@opentiny/vue-icon'
import BindEventsDialog, { open as openDialog } from './BindEventsDialog.vue'
import AddEventsDialog from './AddEventsDialog.vue'

export default {
  components: {
    BlockLinkEvent,
    BindEventsDialog,
    TinyPopover: Popover,
    TinyButton: Button,
    IconChevronDown: iconChevronDown(),
    SvgButton,
    AddEventsDialog
  },
  inheritAttrs: false,
  setup() {
    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { pageState } = useCanvas()
    const { getBlockEvents, getCurrentBlock, removeEventLink } = useBlock()
    const { getMaterial } = useMaterial()
    const { confirm } = useModal()
    const locale = i18n.global.locale.value
    const { highlightMethod } = getMetaApi(META_APP.Page)
    const { commonEvents = {} } = getMergeMeta('engine.setting.event').options

    const state = reactive({
      eventName: '', // 事件名称
      eventBinding: null, // 事件绑定的处理方法对象
      componentEvent: {},
      customEvents: commonEvents,
      bindActions: {},
      showBindEventDialog: false
    })

    const isBlock = computed(() => Boolean(pageState.isBlock))
    const isEmpty = computed(() => Object.keys(state.bindActions).length === 0)
    const renderEventList = computed(() => ({ ...state.componentEvent, ...state.customEvents }))

    watchEffect(() => {
      const componentName = pageState?.currentSchema?.componentName
      const componentSchema = getMaterial(componentName)
      state.componentEvent = componentSchema?.content?.schema?.events || componentSchema?.schema?.events || {}
      const props = pageState?.currentSchema?.props || {}
      const keys = Object.keys(props)
      state.bindActions = {}
      // 遍历组件事件元数据
      Object.entries(renderEventList.value).forEach(([eventName, componentEvent]) => {
        // 查找组件已添加的事件
        if (keys.indexOf(eventName) > -1) {
          const event = props[eventName]
          const { value, params } = event
          const eventArgs = (!params && value.match(/\((.+)\)$/)?.[1]?.split(',')) || params
          const action = {
            eventName,
            ref: '',
            event: props[eventName],
            params: eventArgs
          }

          if (action.event.type === 'JSExpression') {
            action.ref = action.event.value.replace('this.', '').replace(/\(.*\)$/, '')
          }

          if (pageState.isBlock) {
            // 区块编辑态时设置选中组件的事件元数据
            action.metaEvent = componentEvent

            const blockEvents = getBlockEvents(getCurrentBlock())
            const componentId = pageState?.currentSchema?.id

            if (componentId && blockEvents) {
              Object.entries(blockEvents).forEach(([name, event]) => {
                if (componentId === event?.linked?.id && eventName === event?.linked?.event) {
                  action.linked = event.linked
                  action.linkedEventName = name
                }
              })
            }
          }

          state.bindActions[eventName] = action
        }
      })
    })

    const openActionDialog = (action, isAdd) => {
      if (isAdd && state.bindActions[action.eventName]) {
        return
      }

      state.eventBinding = action

      openDialog()
    }

    const deleteAction = (action) => {
      const keys = Object.keys(pageState?.currentSchema?.props || {})

      if (keys.indexOf(action.eventName) > -1) {
        delete pageState.currentSchema.props[action.eventName]
      }
    }

    const delEvent = (action) => {
      confirm({
        title: '提示',
        message: `您确定要删除事件 ${action.eventName} 吗?`,
        exec() {
          if (pageState.isBlock) {
            removeEventLink({ linked: action.linked })
          }

          deleteAction(action)
        }
      })
    }

    const openCodePanel = (action) => {
      if (action) {
        activePlugin(PLUGIN_NAME.Page).then(() => {
          if (highlightMethod) {
            highlightMethod(action.ref)
          }
        })
      }
    }

    const handleToggleAddEventDialog = (visible) => {
      state.showBindEventDialog = visible
    }

    const handleAddEvent = (params) => {
      const { eventName, eventDescription } = params

      Object.assign(state.customEvents, {
        [eventName]: {
          label: {
            zh_CN: eventDescription
          },
          description: {
            zh_CN: `${eventDescription}的回调函数`
          },
          type: 'event',
          functionInfo: {
            params: [],
            returns: {}
          },
          defaultValue: ''
        }
      })

      state.showBindEventDialog = false
    }

    return {
      state,
      isBlock,
      isEmpty,
      delEvent,
      openCodePanel,
      openActionDialog,
      handleAddEvent,
      handleToggleAddEventDialog,
      renderEventList,
      locale
    }
  }
}
</script>

<style lang="less" scoped>
.custom-event {
  padding: 10px 20px 10px 10px;
  footer {
    text-align: center;
  }
}
.bind-action-list {
  .bind-actions {
    margin-top: 20px;
    .binding-name {
      word-break: break-all;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      .item {
        margin-right: 10px;
      }
    }
    .event-bind {
      color: var(--ti-lowcode-events-event-bind-color);
    }
    .bind-action-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: pointer;
      color: var(--ti-lowcode-events-bind-action-item-color);
      border-bottom: 1px solid var(--ti-lowcode-events-bind-action-item-border-color);
      &:first-child {
        border-top: 1px solid var(--ti-lowcode-events-bind-action-item-border-color);
      }
      &:hover {
        background: var(--ti-lowcode-events-bind-action-item-hover-bg-color);
      }

      .linked {
        color: var(--ti-lowcode-events-bind-action-item-linked-color);
      }
    }
  }
  .popover-head {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    .bind-action-button-item {
      width: 50%;
      &:not(:last-child) {
        margin-right: 12px;
      }
    }
    .add-custom-event-button {
      margin-right: 0;
    }
    .bind-event-btn {
      padding: 0 16px;
      width: 100%;
      .bind-event-btn-icon {
        margin-right: 0;
        margin-left: 4px;
      }
    }
  }
  .empty-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--ti-lowcode-events-empty-action-bg-color);
    color: var(--ti-lowcode-events-empty-action-color);
    padding: 24px 18px;
    margin-top: var(--te-common-vertical-item-spacing-normal);
    .empty-action-icon {
      font-size: 48px;
    }
    .icon {
      text-align: center;
      opacity: 0.4;
    }
    .center {
      margin-top: 4px;
    }
    .text {
      margin-top: 12px;
    }
  }
}
.bind-event-list {
  color: var(--ti-lowcode-events-bind-event-list-color);
}
.bind-event-list-item-notallow {
  cursor: not-allowed;
  pointer-events: none;
  color: var(--ti-lowcode-events-bind-event-list-item-disabled-color);
}
.bind-event-list-item {
  padding: 0 16px;
  margin: 0 -16px;
  line-height: 24px;
  &:hover {
    cursor: pointer;
    background: var(--lowcode-events-bind-event-list-item-hover-bg-color);
  }
}
</style>
