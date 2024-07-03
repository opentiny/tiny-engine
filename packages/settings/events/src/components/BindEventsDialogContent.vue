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
        <span class="set-params-tip">扩展参数设置</span>
        <tiny-popover placement="top-start" width="350" trigger="hover">
          <template #reference>
            <icon-help-query></icon-help-query>
          </template>
          <p>
            扩展参数：调用当前事件传入的真实参数，数组格式，追加在原有事件参数之后<br />
            如:
            {{ context.bindMethodInfo.name }}(eventArgs, extParam1, extParam2, ...)
          </p>
        </tiny-popover>

        <tiny-switch v-model="context.enableExtraParams" class="set-switch" :show-text="true">
          <template #open>
            <span>开启</span>
          </template>
          <template #close>
            <span>关闭</span>
          </template>
        </tiny-switch>
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
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import { Input, Popover, Switch } from '@opentiny/vue'
import { iconHelpQuery } from '@opentiny/vue-icon'
import { inject } from 'vue'
import { METHOD_TIPS_MAP, NEW_METHOD_TYPE, VALID_VARNAME_RE } from './constants'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyInput: Input,
    TinyPopover: Popover,
    IconHelpQuery: iconHelpQuery(),
    TinySwitch: Switch
  },
  props: {
    dialogVisible: Boolean
  },
  setup() {
    const { PLUGIN_NAME, getPluginApi } = useLayout()
    const { getMethodNameList } = getPluginApi(PLUGIN_NAME.PageController)

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
      context.tip = METHOD_TIPS_MAP.default
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
        padding: 12px 8px;
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
      }
      .mark {
        width: 100%;
        height: 216px;
        position: absolute;
        z-index: 1;
        top: 0;
        background-color: var(--ti-lowcode-bind-event-dialog-mark-bg-color);
      }
    }

    .params-tip {
      margin: 8px 0;
      color: var(--ti-lowcode-error-tip-color);
    }
  }
  .content-right-top .content-right-title,
  .content-right-bottom .content-right-title {
    font-weight: 600;
    margin-bottom: 12px;
    .set-params-tip {
      margin-right: 3px;
    }
    .set-switch {
      width: 60px;
      margin-left: 10px;
    }
  }

  .tip-error {
    .content-right-monaco {
      border: 1px solid var(--ti-lowcode-error-tip-color);
    }
    .params-tip,
    .new-action-tip {
      color: var(--ti-lowcode-error-tip-color);
    }
  }
}
</style>
