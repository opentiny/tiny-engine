<template>
  <div class="basic-tag-configurator">
    <div class="tag-list">
      <template v-for="(item, index) in tags" :key="index">
        <div class="tag-item">
          <template v-if="editingIndex === index">
            <tiny-input
              ref="editInputRef"
              v-model="editingName"
              size="small"
              :class="{ 'is-error': !!editErrorMessage }"
              v-bind="sanitizedInputProps"
              @keyup.enter="onEditConfirm"
              @blur="onEditConfirm"
              @keydown.esc="onEditCancel"
            />
            <div v-if="editErrorMessage" class="error-text">{{ editErrorMessage }}</div>
          </template>
          <template v-else>
            <tiny-tag :type="item.type" closable @close="onRemove(index)">
              <span class="tag-name" :title="item.name" @dblclick="onEditStart(index)">{{ truncated(item.name) }}</span>
            </tiny-tag>
          </template>
        </div>
      </template>
      <div class="tag-add">
        <template v-if="isAdding">
          <tiny-input
            ref="addInputRef"
            v-model="addingName"
            size="small"
            :class="{ 'is-error': !!addErrorMessage }"
            v-bind="sanitizedInputProps"
            @keyup.enter="onAddConfirm"
            @blur="onAddConfirm"
            @keydown.esc="onAddCancel"
          />
          <div v-if="addErrorMessage" class="error-text">{{ addErrorMessage }}</div>
        </template>
        <template v-else>
          <tiny-button size="mini" @click="onAddStart">{{ addButtonText }}</tiny-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Input as TinyInput, Tag as TinyTag, Button as TinyButton } from '@opentiny/vue'

type TagItem = {
  name: string
  type?: string
}

type RuleObject = {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  message?: string
}

type RuleFn = (val: string) => true | string | Promise<true | string>

const props = withDefaults(
  defineProps<{
    modelValue: TagItem[]
    rules?: Array<RuleObject | RuleFn>
    inputProps?: Record<string, any>
    defaultType?: string
    maxDisplayLength?: number
    addButtonText?: string
  }>(),
  {
    modelValue: () => [],
    rules: () => [],
    inputProps: () => ({}),
    defaultType: undefined,
    maxDisplayLength: 16,
    addButtonText: '新增标签'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: TagItem[]): void
}>()

const tags = computed<TagItem[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

const isAdding = ref(false)
const addingName = ref('')
const addErrorMessage = ref('')
const addInputRef = ref<any>(null)

const editingIndex = ref<number>(-1)
const editingName = ref('')
const editErrorMessage = ref('')
const editInputRef = ref<any>(null)

const conflictKeys = new Set(['modelValue', 'value', 'onInput', 'onUpdate:modelValue', 'onChange'])

const sanitizedInputProps = computed<Record<string, any>>(() => {
  const res: Record<string, any> = {}
  const src = props.inputProps || {}
  for (const key in src) {
    if (!conflictKeys.has(key)) {
      res[key] = src[key]
    }
  }
  return res
})

const truncated = (name: string) => {
  const limit = props.maxDisplayLength || 16
  return name?.length > limit ? `${name.slice(0, limit)}...` : name
}

const normalizeName = (raw: string) => (raw || '').trim()

const isDuplicate = (normalized: string, excludeIndex: number | undefined) => {
  return tags.value.some((t, idx) => {
    // 排除当前索引
    if (typeof excludeIndex === 'number' && idx === excludeIndex) {
      return false
    }

    return normalizeName(t.name) === normalized
  })
}

const runObjectRule = (rule: RuleObject, value: string): true | string => {
  const len = value.length

  if (rule.required && len === 0) {
    return rule.message || '必填项'
  }

  if (typeof rule.min === 'number' && len < rule.min) {
    return rule.message || `长度至少为 ${rule.min}`
  }

  if (typeof rule.max === 'number' && len > rule.max) {
    return rule.message || `长度不超过 ${rule.max}`
  }

  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message || '格式不符合要求'
  }

  return true
}

const validate = async (value: string, excludeIndex?: number): Promise<true | string> => {
  const raw = value ?? ''

  if (!raw.length) {
    return '名称不能为空'
  }

  if (isDuplicate(raw, typeof excludeIndex === 'number' ? excludeIndex : undefined)) {
    return '名称已存在'
  }

  for (const r of props.rules || []) {
    if (typeof r !== 'function') {
      const res = runObjectRule(r as RuleObject, raw)

      if (res !== true) {
        return res
      }
    } else if (typeof r === 'function') {
      const out = await (r as RuleFn)(raw)
      if (out !== true) {
        return out
      }
    }
  }

  return true
}

const emitUpdate = (next: TagItem[]) => {
  emit('update:modelValue', next)
}

const focusInput = (refEl: any) => {
  nextTick(() => {
    try {
      const input = refEl?.value?.getInput ? refEl.value.getInput() : refEl?.value?.$el?.querySelector('input')
      if (typeof input?.focus === 'function') {
        input.focus()
      }
    } catch (e) {
      // ignore
    }
  })
}

const onAddStart = () => {
  isAdding.value = true
  addingName.value = ''
  addErrorMessage.value = ''
  focusInput(addInputRef)
}

const onAddCancel = () => {
  isAdding.value = false
  addingName.value = ''
  addErrorMessage.value = ''
}

const onAddConfirm = async () => {
  const name = addingName.value
  const trimmed = (name || '').trim()
  if (!trimmed.length) {
    onAddCancel()
    return
  }
  const res = await validate(trimmed)
  if (res !== true) {
    addErrorMessage.value = String(res)
    focusInput(addInputRef)
    return
  }
  const next = [...tags.value, { name: trimmed, type: props.defaultType }]
  emitUpdate(next)
  onAddCancel()
}

const onEditStart = (index: number) => {
  editingIndex.value = index
  editingName.value = tags.value[index]?.name || ''
  editErrorMessage.value = ''
  focusInput(editInputRef)
}

const onEditCancel = () => {
  editingIndex.value = -1
  editingName.value = ''
  editErrorMessage.value = ''
}

const onEditConfirm = async () => {
  const idx = editingIndex.value
  if (idx < 0) return

  const original = tags.value[idx]
  const newRaw = editingName.value
  const newTrimmed = (newRaw || '').trim()

  // 如果新名称是空，则取消编辑
  if (!newTrimmed.length) {
    onEditCancel()
    return
  }

  const res = await validate(newTrimmed, idx)
  if (res !== true) {
    editErrorMessage.value = String(res)
    focusInput(editInputRef)
    return
  }

  const next = [...tags.value]
  next[idx] = { ...original, name: newTrimmed }
  emitUpdate(next)
  onEditCancel()
}

const onRemove = (index: number) => {
  const next = tags.value.slice()
  next.splice(index, 1)
  emitUpdate(next)
}
</script>

<style scoped lang="less">
.basic-tag-configurator {
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: flex-start;
  }

  .tag-item {
    display: flex;
    flex-direction: column;
    .tiny-tag {
      margin-right: 0;
    }
  }

  .tag-name {
    user-select: none;
  }

  .tag-add {
    display: flex;
    flex-direction: column;
  }

  .is-error :deep(.tiny-input__inner),
  .is-error :deep(textarea.tiny-textarea__inner) {
    border-color: var(--ti-common-color-error, #f56c6c);
  }

  .error-text {
    color: var(--ti-common-color-error, #f56c6c);
    font-size: 12px;
    line-height: 16px;
    margin-top: 2px;
  }
}
</style>
