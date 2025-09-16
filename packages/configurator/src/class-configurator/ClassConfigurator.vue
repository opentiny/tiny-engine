<template>
  <basic-tag-configurator
    :model-value="tagItems"
    :rules="mergedRules"
    :input-props="inputProps"
    :default-type="defaultType"
    :max-display-length="maxDisplayLength"
    :add-button-text="addButtonText"
    @update:modelValue="onTagItemsUpdate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BasicTagConfigurator from '../basic-tag-configurator/BasicTagConfigurator.vue'

type TagItem = { name: string; type?: string }
type RuleObject = { required?: boolean; min?: number; max?: number; pattern?: RegExp; message?: string }
type RuleFn = (val: string) => true | string | Promise<true | string>

const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    rules?: Array<RuleObject | RuleFn>
    inputProps?: Record<string, any>
    defaultType?: string
    maxDisplayLength?: number
    asArray?: boolean
    addButtonText?: string
  }>(),
  {
    rules: () => [],
    inputProps: () => ({}),
    defaultType: undefined,
    maxDisplayLength: 16,
    asArray: false,
    addButtonText: '新增类名'
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string | string[]): void }>()

const splitToNames = (val: string | string[] | undefined | null): string[] => {
  if (Array.isArray(val)) {
    return val
      .filter((s) => typeof s === 'string')
      .map((s) => (s || '').trim())
      .filter(Boolean)
  }
  if (typeof val === 'string') {
    return val
      .split(/\s+/)
      .map((s) => (s || '').trim())
      .filter(Boolean)
  }
  return []
}

const tagItems = computed<TagItem[]>(() =>
  splitToNames(props.modelValue).map((name) => ({ name, type: props.defaultType }))
)

const builtinRules: Array<RuleObject | RuleFn> = [
  { required: true, message: '类名不能为空' },
  {
    pattern: /^[^\s.#>~+]+$/,
    message: "类名不能包含空格、'.', '#', '>', '~', '+'"
  },
  (val: string) => {
    const v = (val || '').trim()
    if (!/^[-_a-zA-Z]/.test(v)) return '必须以下划线、连字符 - 或字母开头'
    return true
  }
]

const mergedRules = computed(() => [...builtinRules, ...(props.rules || [])])

const onTagItemsUpdate = (items: TagItem[]) => {
  const names = items.map((i) => (i.name || '').trim()).filter(Boolean)
  const uniqueNames: string[] = []
  const seen = new Set<string>()
  names.forEach((n) => {
    if (!seen.has(n)) {
      seen.add(n)
      uniqueNames.push(n)
    }
  })

  if (props.asArray || Array.isArray(props.modelValue)) {
    emit('update:modelValue', uniqueNames)
  } else {
    emit('update:modelValue', uniqueNames.join(' '))
  }
}
</script>
