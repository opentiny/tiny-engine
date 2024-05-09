<template>
    <t-form label-position="left">
        <t-form-item v-for="(item,idx) of data" :label="`元素-${idx}`" :key="idx">
            <div class="widget">
                <component :is="record[props.property.items]" v-model="data[idx]" />
                <popover title="确定要删除吗" trigger="manual" :modelValue="triggerVisible === idx">
                    <template #reference>
                        <plus class="widget__plus" @click="triggerVisible = triggerVisible === idx ? -1 : idx" />
                    </template>
                    <div>
                        <t-button type="danger" @click="deleteItem">
                            确认
                        </t-button>
                        <t-button @click="triggerVisible=false">
                            取消
                        </t-button>
                    </div>
                </popover>
            </div>
        </t-form-item>
        <t-button @click="()=>data.push(0)" style="margin-top: 16px;">
            添加元素
        </t-button>
    </t-form>
</template>
  
<script setup>
import { defineEmits, defineProps, ref, watch } from 'vue'
import { Form as TForm, FormItem as TFormItem, Input as TInput, Button as TButton, Checkbox, Numeric, Popover} from '@opentiny/vue'
import { IconPlus } from '@opentiny/vue-icon';
const props = defineProps({
  modelValue: Array,
  defaultValue: Array,
  property: Object
})
const record = {
    'boolean': Checkbox,
    'number': Numeric,
    'string': TInput
}
const plus = IconPlus();
const emits = defineEmits(['update:modelValue'])
const data = ref([...props.defaultValue]);
const triggerVisible = ref(-1);
/**
 * @param {number} idx
 */
const deleteItem = (idx)=>{
    data.value.splice(idx,1);
    triggerVisible.value = -1;
}
watch(data, () => {
    emits('update:modelValue', data.value)
}, {deep: true})
</script>

<style scoped lang="less">
.widget {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1em;
    &__plus {
        font-size: 24px;
        rotate: 45deg;
        color: rgb(255, 38, 38);
        cursor: pointer;
    }
}
</style>