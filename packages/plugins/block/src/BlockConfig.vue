<template>
  <tiny-form ref="blockForm" class="block-setting-content" :model="formData" :rules="rules">
    <tiny-form-item label="区块名称" prop="name_cn">
      <div>
        <tiny-input
          v-model="formData.name_cn"
          placeholder="请输入区块名称"
          @blur="changeBlockProperty('name_cn')"
        ></tiny-input>
      </div>
    </tiny-form-item>
    <tiny-form-item label="区块ID" prop="label">
      <div>
        <tiny-input v-model="formData.label" placeholder="请输入区块ID" disabled></tiny-input>
      </div>
      <div class="global-desc-info">区块的唯一标志</div>
    </tiny-form-item>
    <tiny-form-item label="区块描述" prop="description">
      <div>
        <tiny-input
          v-model="formData.description"
          placeholder="请输入区块描述"
          @blur="changeBlockProperty('description')"
        ></tiny-input>
      </div>
    </tiny-form-item>
    <tiny-form-item label="区块分类" prop="categoryId">
      <tiny-select
        ref="groupSelect"
        v-model="formData.categoryId"
        popper-class="block-popper"
        placeholder="默认分类"
        :options="categoryList"
        filterable
        :filter-method="categoryFilter"
        clearable
        @change="changeCategory"
      >
      </tiny-select>
    </tiny-form-item>
    <tiny-form-item label="区块标签" prop="tags">
      <div class="block-tag-create">
        <tiny-tag
          v-for="(tag, index) in formData.tags"
          :key="index"
          closable
          class="tag-button"
          @close="deleteTag(tag)"
        >
          <span :title="tag" class="tag-item-text">{{ tag }}</span>
        </tiny-tag>
        <tiny-input
          v-show="state.inputVisible"
          ref="saveTagInput"
          v-model="state.inputValue"
          size="small"
          @keyup.enter="confirmTagInput"
          @blur="confirmTagInput"
        >
        </tiny-input>
        <tiny-button v-show="!state.inputVisible" class="button-new-tag" size="small" @click="addTag">
          + 标签
        </tiny-button>
      </div>
      <div class="global-desc-info">区块的功能以及特性标签，例如表格、购买页、过滤等</div>
    </tiny-form-item>
    <tiny-form-item label="公开范围" prop="openness">
      <div class="block-openness">
        <div class="block-openness-public">
          <tiny-radio v-model="formData.public" :label="BLOCK_OPENNESS.Private" @change="changeOpenness"
            >私有</tiny-radio
          >
          <tiny-radio v-model="formData.public" :label="BLOCK_OPENNESS.Open" @change="changeOpenness">公开</tiny-radio>
          <tiny-radio v-model="formData.public" :label="BLOCK_OPENNESS.Special" @change="changeOpenness"
            >半公开</tiny-radio
          >
          <div v-show="formData.public === BLOCK_OPENNESS.Special" class="block-openness-tenants">
            <tiny-select
              v-model="formData.public_scope_tenants"
              placeholder="请选择组织"
              filterable
              collapse-tags
              multiple
              @change="changeBlockProperty('public_scope_tenants')"
            >
              <tiny-option
                v-for="item in state.publicOptions"
                :key="item.id"
                :label="item.name_cn || item.tenant_id"
                :value="item.id"
              >
              </tiny-option>
            </tiny-select>
          </div>
        </div>
      </div>
      <div class="global-desc-info">区块的开放范围，可以为私有或公开或对特定组织开放</div>
    </tiny-form-item>
  </tiny-form>
</template>

<script>
import { reactive, ref, computed, nextTick, watchEffect } from 'vue'
import { Input, Tag, Button, Form, FormItem, Radio, Select, Option } from '@opentiny/vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { remove } from '@opentiny/vue-renderless/common/array'
import { getEditBlock } from './js/blockSetting'
import { useBlock, useEditorInfo } from '@opentiny/tiny-engine-controller'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'

const { BLOCK_OPENNESS } = constants

export default {
  components: {
    TinyTag: Tag,
    TinyInput: Input,
    TinyButton: Button,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyRadio: Radio,
    TinySelect: Select,
    TinyOption: Option
  },
  setup() {
    const { getCategoryList } = useBlock()
    const nameCn = 'name_cn'
    const state = reactive({
      inputVisible: false,
      inputValue: '',
      publicOptions: useEditorInfo().userInfo.tenants
    })

    const groupSelect = ref(null)

    const formData = reactive({
      tags: [],
      name_cn: '',
      label: '',
      categoryId: '',
      description: '',
      public: '',
      public_scope_tenants: []
    })

    const blockForm = ref(null)

    const categoryList = computed(() =>
      getCategoryList().map((item) => ({ ...item, value: item.id, label: item.name }))
    )

    watchEffect(() => {
      const block = getEditBlock()
      if (formData.id && block.id === formData.id) {
        // 防止修改区块数据后，重复赋值
        return
      }
      if (!block.tags) {
        block.tags = []
      }
      Object.assign(formData, block)
      formData[nameCn] = block[nameCn] ?? block.label
      const [id] = block.categories || []
      formData.categoryId = id || ''
    })

    const rules = {
      name_cn: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    const saveTagInput = ref(null)

    const deleteTag = (tag) => {
      remove(formData.tags, tag)
    }

    const validateForm = () => {
      return new Promise((resolve, reject) => {
        blockForm.value.validate((valid) => {
          if (valid) {
            resolve()
          } else {
            reject(new Error('校验失败'))
          }
        })
      })
    }

    const clearValidateForm = () => {
      blockForm.value?.clearValidate()
    }

    const confirmTagInput = () => {
      const block = getEditBlock()
      const inputValue = state.inputValue
      if (inputValue) {
        formData.tags.push(inputValue)
        block.tags = formData.tags
      }

      state.inputVisible = false
      state.inputValue = ''
    }

    const addTag = () => {
      state.inputVisible = true

      nextTick(() => {
        saveTagInput.value.getInput().focus()
      })
    }

    const changeOpenness = () => {
      const block = getEditBlock()

      if (block) {
        block.public = formData.public
      }
      if (formData.public !== BLOCK_OPENNESS.Special) {
        formData.public_scope_tenants = []
        block.public_scope_tenants = []
      }
    }

    const categoryFilter = (value) => {
      const select = groupSelect.value

      select.state.cachedOptions.forEach((item) => {
        item.state.visible = !value || item.label.includes(value)
      })
    }

    const changeCategory = (value) => {
      const block = getEditBlock()

      if (block) {
        const { category_id } = categoryList.value.find((item) => item.id === value) ?? {}
        block.path = category_id
        block.categories = [value]
      }
    }

    const changeBlockProperty = (property) => {
      const block = getEditBlock()

      if (block) {
        block[property] = formData[property]
      }
    }

    return {
      isVsCodeEnv,
      state,
      rules,
      formData,
      saveTagInput,
      groupSelect,
      categoryList,
      changeCategory,
      validateForm,
      addTag,
      deleteTag,
      confirmTagInput,
      BLOCK_OPENNESS,
      changeOpenness,
      clearValidateForm,
      blockForm,
      categoryFilter,
      changeBlockProperty
    }
  }
}
</script>

<style lang="less" scoped>
.block-setting-content {
  padding: 16px 20px 16px 0;
  :deep(.tiny-form-item__error) {
    display: none;
  }

  .description {
    margin-top: 10px;
    font-size: 12px;
  }
}

.block-tag-create {
  .tag-button {
    color: var(--ti-lowcode-block-config-tag-color);
    background-color: var(--ti-lowcode-block-config-tag-bg);
    height: 28px;
    &:hover {
      color: var(--ti-lowcode-block-config-tag-hover-color);
      background-color: var(--ti-lowcode-block-config-tag-hover-bg);
    }
  }

  .tiny-button.button-new-tag {
    height: 28px;
    line-height: 20px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .tiny-input {
    width: 90px;
    height: 22px;
    line-height: 20px;
    vertical-align: middle;
  }

  .tiny-tag {
    margin: 4px 0;
    & + .tiny-tag,
    & + .tiny-input,
    & ~ .button-new-tag {
      margin-left: 10px;
    }
  }
  :deep(.tiny-input__inner) {
    height: 26px;
  }
}
.block-openness {
  &-public {
    display: flex;
  }
  &-tenants {
    display: inline-block;
  }
}
.tag-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}
</style>
