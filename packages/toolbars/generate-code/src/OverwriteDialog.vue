<template>
  <tiny-dialog-box
    class="overwrite-dialog"
    :visible="visible"
    :append-to-body="true"
    :modal="true"
    :lock-scroll="true"
    width="520px"
    title="选择要覆盖的页面"
    @update:visible="onUpdateVisible"
  >
    <div class="tip">检测到以下同名页面，请勾选需要覆盖的项：</div>
    <div class="actions">
      <tiny-switch :modelValue="allSelected" @update:modelValue="onToggleAll" />
      <span class="switch-label">全选</span>
    </div>
    <div class="list">
      <label class="row" v-for="item in nameList" :key="item">
        <tiny-checkbox :modelValue="state.selected.has(item)" @update:modelValue="(v:any)=>toggle(item, v)">
          {{ item }}
        </tiny-checkbox>
      </label>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <tiny-button type="primary" @click="emitConfirm">确定</tiny-button>
        <tiny-button @click="emitCancel">取消</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, computed } from 'vue'
import type { PropType } from 'vue'
import { DialogBox, Button, Checkbox, Switch } from '@opentiny/vue'

export default defineComponent({
  name: 'OverwriteDialog',
  components: {
    TinyDialogBox: DialogBox as any,
    TinyButton: Button as any,
    TinyCheckbox: Checkbox as any,
    TinySwitch: Switch as any
  },
  props: {
    visible: { type: Boolean, default: false },
    // 仅用到 name 字段，保持向后扩展空间
    duplicates: { type: Array as PropType<Array<{ name: string }>>, default: () => [] }
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const state = reactive({
      selected: new Set<string>()
    })

    const nameList = computed(() => (props.duplicates || []).map((d) => d.name))

    watch(
      () => props.visible,
      (v) => {
        if (v) {
          // 打开时默认全选（替换为新 Set 以触发响应式）
          state.selected = new Set(nameList.value) as any
        } else {
          state.selected = new Set() as any
        }
      }
    )

    const toggle = (name: string, checked: boolean) => {
      const next = new Set(state.selected)
      if (checked) next.add(name)
      else next.delete(name)
      state.selected = next as any
    }

    const selectAll = () => {
      state.selected = new Set(nameList.value) as any
    }

    const clearAll = () => {
      state.selected = new Set() as any
    }

    const allSelected = computed(() => nameList.value.length > 0 && state.selected.size === nameList.value.length)

    const onToggleAll = (v: boolean) => {
      if (v) selectAll()
      else clearAll()
    }

    const emitCancel = () => {
      emit('update:visible', false)
      emit('cancel')
    }

    const emitConfirm = () => {
      emit('update:visible', false)
      emit('confirm', Array.from(state.selected))
    }

    const onUpdateVisible = (v: boolean) => emit('update:visible', v)

    return {
      state,
      nameList,
      toggle,
      selectAll,
      clearAll,
      allSelected,
      onToggleAll,
      emitCancel,
      emitConfirm,
      onUpdateVisible
    }
  }
})
</script>

<style lang="less" scoped>
.overwrite-dialog {
  .tip {
    font-size: 12px;
    color: var(--te-configurator-common-text-color);
    margin-bottom: 8px;
  }
  .actions {
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .switch-label {
    font-size: 12px;
    color: var(--te-configurator-common-text-color);
  }
  .list {
    max-height: 320px;
    overflow: auto;
    padding: 6px 4px;
    border: 1px solid var(--te-configurator-common-border-color);
    border-radius: 4px;
  }
  .row {
    display: block;
    padding: 4px 6px;
    margin: 2px 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
