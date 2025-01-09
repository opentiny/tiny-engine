<template>
  <div class="add-button">
    <tiny-button @click="addEvent"> <svg-icon name="add"></svg-icon>添加</tiny-button>
  </div>
  <meta-list-items class="list" :optionsList="list" :draggable="false">
    <template #content="{ data }">
      <div :class="{ 'item-text': true, active: data.name === currentEventName }" @click="setEdit(data)">
        {{ data.name }}
      </div>
    </template>
    <template #operate="{ data }">
      <svg-button class="opt-button" :hoverBgColor="false" name="to-edit" @click="setEdit(data)"></svg-button>
      <svg-button class="opt-button" :hoverBgColor="false" name="delete" @click="delBlockEvent(data.name)"></svg-button>
    </template>
  </meta-list-items>
</template>

<script>
import { computed } from 'vue'
import { Button as TinyButton } from '@opentiny/vue'
import { MetaListItems, SvgButton } from '@opentiny/tiny-engine-common'
import {
  getEditBlockEvents,
  setEditEvent,
  getEditEventName,
  setEditEventName,
  addBlockCustomEvent,
  delBlockEvent
} from './js/blockSetting'

export default {
  components: {
    TinyButton,
    MetaListItems,
    SvgButton
  },
  setup() {
    const list = computed(() => Object.entries(getEditBlockEvents() || {}).map(([name, event]) => ({ name, event })))
    const currentEventName = computed(() => getEditEventName())

    const setEdit = ({ name, event }) => {
      setEditEventName(name)
      setEditEvent(event)
    }

    const addEvent = () => {
      setEdit(addBlockCustomEvent())
    }

    return {
      list,
      currentEventName,
      setEdit,
      addEvent,
      delBlockEvent
    }
  }
}
</script>

<style lang="less" scoped>
.list {
  margin-bottom: 8px;
  overflow: auto;
}

.item-text {
  flex: 1;
  color: var(--te-common-text-primary);
}
.item-text.active {
  font-weight: 700;
}

.item-icon + .item-icon {
  margin-left: 8px;
}
.add-button {
  padding: 0 0 8px 0;
  :deep(.tiny-button) {
    border: 1px solid var(--ti-lowcode-base-default-button-border-disable-color);
  }
  .icon-plus {
    margin-right: 6px;
    stroke: var(--te-common-text-weaken);
  }
}
.opt-button {
  width: auto;
  &:last-child {
    margin-right: var(--te-base-space-3x);
  }
}
</style>
