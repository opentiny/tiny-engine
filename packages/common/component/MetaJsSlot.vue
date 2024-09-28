<template>
  <div class="meta-slot-container">
    <div class="label">使用插槽</div>
    <tiny-form ref="slotRef" class="slot-form" :model="slotList" label-width="0" inline>
      <div v-for="(slot, index) in slotList" :key="slot.name" class="use-slot">
        <div class="use-slot-item-name">{{ slot.name }}</div>
        <div class="use-slot-item-content">
          <div class="use-slot-switch-wrap">
            <div :class="['e__switch', { 'e_is-checked': slot.bind }]">
              <span class="e__switch-core" @click="toggleSlot(index, slot)"></span>
            </div>
            <tiny-tooltip effect="dark" :content="state.currentComponent?.content" placement="top">
              <span class="item-icon">
                <component :is="state.currentComponent?.icon"></component>
              </span>
            </tiny-tooltip>
          </div>
          <tiny-form-item
            :prop="paramsPropPath(index)"
            :rules="[{ validator: paramsStringValidator, trigger: 'blur' }]"
            class="slot-name-form-item"
          >
            <tiny-input
              v-model="slot.params"
              class="use-slot-params"
              @change="validParams(paramsPropPath(index), slot)"
            ></tiny-input>
          </tiny-form-item>
        </div>
      </div>
    </tiny-form>
  </div>
</template>

<script>
import { ref, inject, watchEffect, reactive } from 'vue'
import { Input, Tooltip, Form, FormItem } from '@opentiny/vue'
import { useProperties, useCanvas, useModal } from '@opentiny/tiny-engine-controller'
import SvgICons from '@opentiny/vue-icon'
import { verifyJsVarName } from '@opentiny/tiny-engine-controller/js/verification'

export default {
  components: {
    TinyInput: Input,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyTooltip: Tooltip
  },
  props: {
    modelValue: {
      type: Object
    },
    slots: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const path = inject('path', '')
    const slotList = ref(
      props.slots.map((name) => {
        const slotInfo = props.modelValue?.[name]

        return {
          bind: Boolean(slotInfo),
          name,
          params: slotInfo?.params?.join(',') || ''
        }
      })
    )
    const componentsMap = {
      TinyGrid: {
        content:
          '暴露给插槽使用的变量，为解构的参数，可以使用多个用逗号分隔，如：row(行数据)，column(列数据)，$table(内部表格实例)，seq(序号)，cell(单元格)，columnIndex(列索引),rowIndex(行索引)',
        icon: SvgICons['IconUnknow']()
      }
    }

    const state = reactive({
      currentComponent: {}
    })

    const slotRef = ref(null)

    const paramsPropPath = (index) => `${index}.params`

    const paramsStringValidator = (rule, value, callback) => {
      if (value && value.split(',').some((param) => !verifyJsVarName(param))) {
        callback(new Error('仅支持JavaScript中有效的变量名'))
      } else {
        callback()
      }
    }

    const updateSlotParams = (slotData) => {
      emit('update:modelValue', slotData)

      // 更新当前选中组件的根属性，不更新在jsslot中的数据非响应式
      const [propsName] = path.split('.')
      const schema = useProperties().getSchema()
      schema.props[propsName] = JSON.parse(JSON.stringify(schema.props[propsName]))
    }

    const setSlotParams = ({ name, params = '' }) => {
      if (!props.modelValue?.[name]) {
        return
      }

      const slotData = { ...(props.modelValue || {}) }

      if (params.length) {
        slotData[name].params = params.split(',')
      } else {
        delete slotData[name].params
      }

      updateSlotParams(slotData)
    }

    const toggleSlot = (idx, { bind, name, params = '' }) => {
      // 原本绑定的，解除绑定
      if (bind) {
        useModal().confirm({
          title: '提示',
          message: '关闭后插槽内的内容将被清空，是否继续？',
          status: 'info',
          exec: () => {
            slotList.value[idx].bind = false
            const { [name]: _deleted, ...rest } = { ...(props.modelValue || {}) }
            updateSlotParams(rest)
          }
        })

        return
      }

      // 未绑定的，新增绑定
      slotList.value[idx].bind = true

      const slotInfo = {
        [name]: {
          type: 'JSSlot',
          value: [
            {
              componentName: 'div'
            }
          ]
        }
      }

      if (params.length) {
        slotInfo[name].params = params.split(',')
      }

      updateSlotParams({ ...(props.modelValue || {}), ...slotInfo })
    }

    const validParams = (paramsPath, slot) => {
      slotRef.value.validateField([paramsPath], (error) => {
        if (!error) {
          slot.bind && setSlotParams(slot)
        }
      })
    }

    watchEffect(() => {
      const componentName = useCanvas().getCurrentSchema()?.componentName
      state.currentComponent = componentsMap[componentName]
    })

    return {
      toggleSlot,
      slotList,
      paramsPropPath,
      slotRef,
      paramsStringValidator,
      validParams,
      state,
      componentsMap
    }
  }
}
</script>

<style lang="less" scoped>
.meta-slot-container {
  text-align: left;
  color: var(--lowcode-meta-js-slot-color);
}

.slot-form {
  margin-top: 8px;
}

.use-slot {
  display: flex;
  justify-content: center;
  flex-direction: column;
  row-gap: 8px;

  .use-slot-item-content {
    display: flex;
  }

  .use-slot-switch-wrap {
    display: flex;
  }

  &-item-name {
    width: 100px;
  }

  &-switch {
    width: 60px;
  }

  &-params {
    margin-left: 5px;
  }

  & + .use-slot {
    margin-top: 16px;
  }

  .slot-name-form-item {
    margin-bottom: 0;
  }

  .item-icon {
    margin: 3px 3px 0 6px;
  }
}

.e__switch {
  display: inline-flex;
  align-items: center;
  position: relative;
  font-size: 14px;
  line-height: 20px;
  height: 20px;
  vertical-align: middle;
  cursor: pointer;
}

.e__switch-core {
  margin: 0;
  position: relative;
  width: 60px;
  height: 20px;
  border: 1px solid var(--ti-lowcode-base-bg);
  outline: 0;
  border-radius: 10px;
  box-sizing: border-box;
  background: var(--ti-lowcode-base-bg);
  transition: border-color 0.3s, background-color 0.3s;
  vertical-align: middle;
}

.e__switch-core::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 100%;
  transition: all 0.3s;
  width: 16px;
  height: 16px;
  background-color: #ffffff;
}

.e__switch.e_is-checked .e__switch-core {
  border-color: var(--ti-lowcode-base-blue-6);
  background-color: var(--ti-lowcode-base-blue-6);
}

.e__switch.e_is-checked .e__switch-core::after {
  left: 100%;
  margin-left: -17px;
}
</style>
