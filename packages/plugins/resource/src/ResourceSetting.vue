<template>
  <plugin-setting v-if="isShow" :fixed-name="PLUGIN_NAME.Resource" :align="align" :title="state.title">
    <template #header>
      <button-group>
        <tiny-button type="primary" @click="saveResourceSetting">保存</tiny-button>
        <svg-button name="close" @click="cancelResourceSetting"></svg-button>
      </button-group>
    </template>

    <template #content>
      <div class="resource-setting-content">
        <tiny-collapse v-model="state.activeName" class="resource-setting-collapse">
          <tiny-collapse-item title="基本设置" name="general">
            <tiny-form
              ref="generalForm"
              :model="state.data"
              :rules="rules"
              label-width="80px"
              label-position="left"
              class="general-config-form"
            >
              <tiny-form-item prop="name" label="分组名称">
                <tiny-input v-model="state.data.name"></tiny-input>
              </tiny-form-item>
              <tiny-form-item prop="description" label="分组描述">
                <tiny-input type="textarea" v-model="state.data.description"></tiny-input>
              </tiny-form-item>
            </tiny-form>
          </tiny-collapse-item>
        </tiny-collapse>
      </div>
    </template>
  </plugin-setting>
</template>
<script lang="ts">
/* metaService: engine.plugins.resource.ResourceSetting */
import { ref, reactive, computed } from 'vue'
import type { Component } from 'vue'
import { TinyButton, Collapse, CollapseItem, Form, FormItem, Input } from '@opentiny/vue'
import { useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { PluginSetting, ButtonGroup, SvgButton } from '@opentiny/tiny-engine-common'
import { createResourceGroup, updateResourceGroup } from './js/http'

const isShow = ref(false)

const state = reactive({
  title: '分组设置',
  activeName: 'general',
  data: {
    name: '',
    description: ''
  }
})

export const openResourceSettingPanel = (data) => {
  if (data) {
    state.data = { ...data }
  }
  isShow.value = true
}

export const closeResourceSettingPanel = () => {
  isShow.value = false
}

export default {
  components: {
    PluginSetting,
    SvgButton,
    TinyButton: TinyButton as Component,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyFormItem: FormItem,
    TinyForm: Form,
    TinyInput: Input,
    ButtonGroup
  },
  props: {},
  emits: ['refreshCategory'],
  setup(props, { emit }) {
    const { PLUGIN_NAME, getPluginByLayout } = useLayout()
    const align = computed(() => getPluginByLayout(PLUGIN_NAME.Resource))

    const generalForm = ref()

    const rules = reactive({
      name: [
        { required: true, message: '必填', trigger: 'blur' },
        { min: 1, max: 32, message: '长度在1-32之间', trigger: 'blur' },
        {
          type: 'string',
          validator: (rule, value, callback) => {
            const regex = /^[\w\-\u4e00-\u9fa5]+$/
            if (!regex.test(value)) {
              callback(new Error('分组名称只能包含中文、英文、数字、下划线、中划线等字符'))
            } else {
              callback()
            }
          }
        }
      ]
    })
    const saveResourceSetting = () => {
      generalForm.value.validate((valid) => {
        if (!valid) {
          return
        }
        if (state.data.id) {
          updateResourceGroup(state.data.id, { name: state.data.name, description: state.data.description })
            .then(() => {
              emit('refreshCategory')
              closeResourceSettingPanel()
              useNotify({ message: '修改资源分组成功', type: 'success' })
            })
            .catch((err) => {
              useNotify({ message: err, type: 'error' })
            })
        } else {
          createResourceGroup(state.data)
            .then(() => {
              emit('refreshCategory')
              closeResourceSettingPanel()
              useNotify({ message: '添加资源分组成功', type: 'success' })
            })
            .catch((err) => {
              useNotify({ message: err, type: 'error' })
            })
        }
      })
    }

    const cancelResourceSetting = () => {
      closeResourceSettingPanel()
    }

    return {
      PLUGIN_NAME,
      align,
      isShow,
      generalForm,
      state,
      rules,
      saveResourceSetting,
      cancelResourceSetting
    }
  }
}
</script>
<style lang="less" scoped>
.resource-plugin-setting {
  :deep(.plugin-setting-content) {
    padding: 0 0 16px 0;
  }
  :deep(.tiny-collapse) {
    border-bottom: 0;
  }
}
.resource-setting-collapse {
  :deep(.tiny-collapse-item__header) {
    &,
    &.is-active {
      &::before {
        border: none;
      }
    }

    .svg-icon {
      margin-right: 6px;
    }
  }
  :deep(.tiny-collapse-item__content) {
    padding: 0 12px 12px;
  }
}
</style>
