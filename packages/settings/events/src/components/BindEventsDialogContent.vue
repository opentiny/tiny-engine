<template>
  <div class="content-right">
    <div :class="['content-right-top', { 'tip-error': context.tipError }]">
      <div class="content-right-title">方法名称</div>
      <tiny-input
        v-model="context.bindMethodInfo.name"
        :disabled="context.bindMethodInfo.type !== NEW_METHOD_TYPE"
        :class="[{ 'status-error': context.tipError }]"
        placeholder="请从左侧选择一个方法进行绑定，或者选择添加新方法，输入自定义方法名称。"
        @update:modelValue="change"
      ></tiny-input>
      <div class="new-action-tip">{{ context.tip }}</div>
    </div>
    <div :class="['content-right-bottom', { 'tip-error': !context.isValidParams }]">
      <div class="content-right-title">
        <tiny-checkbox v-model="context.enableExtraParams" name="tiny-checkbox">扩展参数设置</tiny-checkbox>
        <div class="set-params-tip">
          <div>扩展参数：调用当前事件传入的真实参数，数组格式，追加在原有事件参数之后</div>
          如: {{ context.bindMethodInfo.name }}(eventArgs, extParam1, extParam2, ...)
        </div>
      </div>

      <div class="content-right-monaco">
        <monaco-editor
          v-if="dialogVisible"
          :value="context.editorContent"
          :options="editorOptions"
          @change="editorContentChange"
          class="monaco-editor"
        />
        <div v-if="!context.enableExtraParams" class="mark"></div>
      </div>
      <div v-if="!context.isValidParams && context.enableExtraParams" class="params-tip">
        请输入数组格式的参数，参数可以为表达式。例如：["extParam1", "item.status", 1, "getNames()"]
      </div>
    </div>
  </div>
</template>

<script>
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { getMetaApi, META_APP } from '@opentiny/tiny-engine-meta-register'
import { Input, Checkbox } from '@opentiny/vue'
import { inject } from 'vue'
import { METHOD_TIPS_MAP, NEW_METHOD_TYPE, VALID_VARNAME_RE } from './constants'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyInput: Input,
    TinyCheckbox: Checkbox
  },
  props: {
    dialogVisible: Boolean
  },
  setup() {
    const { getMethodNameList } = getMetaApi(META_APP.Page)

    const context = inject('context')

    const editorOptions = {
      language: 'json',
      lineNumbers: false,
      minimap: {
        enabled: false
      }
    }

    const editorContentChange = (content) => {
      context.editorContent = content
    }

    const validMethodNameEmpty = (name) => !name

    const validMethodNameExist = (name) => getMethodNameList?.().includes(name)

    const invalidMethodName = (name) => !VALID_VARNAME_RE.test(name)

    const change = (value) => {
      const validRules = [
        { validator: validMethodNameEmpty, tip: METHOD_TIPS_MAP.empty },
        { validator: validMethodNameExist, tip: METHOD_TIPS_MAP.exist },
        { validator: invalidMethodName, tip: METHOD_TIPS_MAP.ruleInvalid }
      ]
      for (let i = 0; i < validRules.length; i++) {
        const rule = validRules[i]
        if (rule.validator(value)) {
          context.tipError = true
          context.tip = rule.tip

          // 若存在校验不通过的，则直接返回，不继续走下面的流程
          return
        }
      }
      context.tipError = false
      context.tip = ''
    }

    return {
      NEW_METHOD_TYPE,
      context,
      editorOptions,
      change,
      editorContentChange
    }
  }
}
</script>

<style lang="less" scoped>
.content-right {
  width: 68%;

  .content-right-top {
    .new-action-tip {
      margin: 8px 0;
      color: var(--ti-lowcode-bind-event-dialog-new-action-tip-color);
    }
  }
  .content-right-bottom {
    .content-right-monaco {
      border: 1px solid var(--ti-lowcode-bind-event-dialog-content-right-monaco-border-color);
      overflow: hidden;
      position: relative;

      .monaco-editor {
        width: 100%;
        height: 216px;
        color: var(--te-common-text-secondary);
      }
      .mark {
        width: 100%;
        height: 216px;
        position: absolute;
        z-index: 1;
        top: 0;
      }
    }

    .params-tip {
      margin: 8px 0;
      color: var(--te-common-color-error);
    }
  }
  .content-right-top .content-right-title,
  .content-right-bottom .content-right-title {
    margin-bottom: var(--te-common-vertical-item-spacing-normal);
    .set-params-tip {
      margin-top: 6px;
      font-weight: 400;
      color: var(--te-common-text-weaken);
    }
  }

  .tip-error {
    .content-right-monaco {
      border: 1px solid var(--te-common-color-error);
    }
    .params-tip,
    .new-action-tip {
      color: var(--te-common-color-error);
    }
  }
}
</style>
