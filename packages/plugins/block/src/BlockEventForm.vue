<template>
  <tiny-form label-position="left" label-width="60px" show-message :model="formData" :rules="rules">
    <tiny-form-item label="事件名" prop="eventName">
      <tiny-input class="event-name" v-model="formData.eventName" :placeholder="eventNameTip" @blur="changeEventName">
        <template #suffix>
          <tiny-popover placement="bottom-end" trigger="hover" :close-delay="0" @show="state.showPopover = true">
            <template #reference>
              <tiny-icon-rich-text-link :class="{ 'bind-propertys': isUpdateEvent }" />
            </template>
            <div class="property-list" v-show="state.showPopover">
              <div class="property-list-title">
                <tiny-icon-rich-text-link />
                双向绑定属性
              </div>
              <ul class="property-list-content">
                <li
                  v-for="(item, index) in propertys"
                  :key="index"
                  :class="{ existed: eventNameList.has(`onUpdate:${item.property}`) }"
                  @click="usePropertysToBeEvent(item)"
                >
                  <div>{{ item.property }}</div>
                </li>
              </ul>
            </div>
          </tiny-popover>
        </template>
      </tiny-input>
    </tiny-form-item>
    <tiny-form-item label="标签名">
      <tiny-input v-model="label"></tiny-input>
    </tiny-form-item>
    <tiny-form-item label="描述">
      <tiny-input v-model="description"></tiny-input>
    </tiny-form-item>
    <div v-if="linked" class="linked-info">链接到组件: {{ linked.componentName }} 事件: {{ linked.event }}</div>
  </tiny-form>
</template>

<script lang="ts">
/* metaService: engine.plugins.blockmanage.BlockEventForm */
import { computed, reactive, watch } from 'vue'
import { Input as TinyInput, Form as TinyForm, FormItem as TinyFormItem, TinyPopover } from '@opentiny/vue'
import { REGEXP_EVENT_NAME, verifyEventName } from '@opentiny/tiny-engine-common/js/verification'
import {
  getEditBlockPropertyList,
  getEditBlockEvents,
  getEditEvent,
  getEditEventName,
  renameBlockEventName
} from './js/blockSetting'
import { IconRichTextLink } from '@opentiny/vue-icon'

export default {
  components: {
    TinyForm,
    TinyInput,
    TinyFormItem,
    TinyPopover,
    TinyIconRichTextLink: IconRichTextLink()
  },
  setup() {
    const propertys = computed(() => getEditBlockPropertyList())
    const events = computed(() => getEditBlockEvents())
    const state = reactive({
      showPopover: false
    })
    const eventNameTip = '事件名为小写字符或onUpdate:开头的驼峰形式，例：customEvent, onUpdate:propsName'
    const linked = computed(() => (getEditEvent() || {}).linked)
    const eventNameList = computed(() => new Set(Object.keys(events.value)))

    const label = computed({
      get: () => getEditEvent()?.label?.zh_CN || '',
      set(value) {
        const event = getEditEvent()

        if (event && event.label) {
          event.label.zh_CN = value
        }
      }
    })

    const description = computed({
      get: () => getEditEvent()?.description?.zh_CN || '',
      set(value) {
        const event = getEditEvent()

        if (event && event.description) {
          event.description.zh_CN = value
        }
      }
    })

    const formData = reactive({
      eventName: getEditEventName() || ''
    })

    const isUpdateEvent = computed(() => formData.eventName.startsWith('onUpdate:'))

    const usePropertysToBeEvent = (item: any) => {
      if (item.label?.text?.zh_CN) label.value = item.label.text.zh_CN
      renameBlockEventName(`onUpdate:${item.property}`, getEditEventName())
      state.showPopover = false
    }

    const rules = {
      eventName: [
        {
          pattern: REGEXP_EVENT_NAME,
          validator: (rule: any /* IFormInnerRule */, value: string, callback: (e?: Error) => void) => {
            if (isUpdateEvent.value) {
              const matched = /^onUpdate:[a-zA-Z_$][\w$]*$/.test(value)
              const propertyMatched = propertys.value.some((item) => item.property === value.replace('onUpdate:', ''))
              return matched && propertyMatched
                ? callback()
                : callback(new Error(`${value} 需要有对应的 ${value.replace('onUpdate:', '')} 在属性中定义`))
            }
            if (!rule.pattern.test(value)) {
              callback(new Error(eventNameTip))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    }

    watch(
      () => getEditEventName(),
      () => {
        formData.eventName = getEditEventName() || ''
      }
    )

    const changeEventName = () => {
      if (formData.eventName !== getEditEventName() && verifyEventName(formData.eventName)) {
        renameBlockEventName(formData.eventName, getEditEventName())
      }
    }

    return {
      state,
      propertys,
      events,
      rules,
      label,
      linked,
      formData,
      description,
      eventNameTip,
      eventNameList,
      isUpdateEvent,
      changeEventName,
      usePropertysToBeEvent
    }
  }
}
</script>

<style lang="less" scoped>
.linked-info {
  margin-top: 10px;
  padding: 15px 0px;
  border-top: 1px solid var(--te-block-event-link-border-color);
}

.event-name {
  :deep(.tiny-input__inner.tiny-input__inner) {
    padding-right: var(--tv-Input-suffix-padding-right);
    padding-left: var(--tv-Input-suffix-padding-left);
  }
  .bind-propertys {
    fill: var(--te-component-common-block-add-text-color);
  }
}

.property-list {
  .property-list-title {
    display: flex;
    align-items: center;
    font-weight: bold;
    text-align: left;
    gap: 6px;
    margin-bottom: 6px;
  }
  .property-list-content {
    max-height: 200px;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-inline-start: 10px;
    padding-inline-end: 10px;
  }
  li {
    padding: 0 12px;
    margin: 0 -16px;
    line-height: 24px;
    cursor: pointer;
    &:hover {
      background: var(--te-component-common-bg-color-hover);
    }
  }

  .existed {
    cursor: not-allowed;
    pointer-events: none;
    color: var(--te-component-common-text-color-disabled);
  }
}
</style>
