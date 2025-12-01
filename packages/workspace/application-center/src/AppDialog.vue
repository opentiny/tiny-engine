<template>
  <tiny-dialog-box :visible="visible" title="新建应用" width="400px" append-to-body destroy-on-close @close="cancle">
    <tiny-form
      ref="editAppInfoRef"
      label-position="left"
      label-width="84px"
      label-align
      :model="formState"
      :rules="validRules"
      validate-type="text"
    >
      <tiny-form-item label="应用名称" prop="name">
        <tiny-input v-model="formState.name" placeholder="请输入"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="应用描述" prop="description">
        <tiny-input v-model="formState.description" type="textarea" placeholder="请输入此次发布的修改点"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="场景" prop="sceneId">
        <tiny-select
          v-model="formState.sceneId"
          placeholder="请选择"
          :options="tagsList.scene"
          :disabled="template?.sceneId"
          value-field="id"
          text-field="name"
        ></tiny-select>
      </tiny-form-item>
      <tiny-form-item label="行业" prop="industryId">
        <tiny-select
          v-model="formState.industryId"
          placeholder="请选择"
          :options="tagsList.industry"
          :disabled="template?.industryId"
          value-field="id"
          text-field="name"
        ></tiny-select>
      </tiny-form-item>
      <tiny-form-item label="缩略图">
        <div class="form-item-icon-wrapper">
          <div class="form-item-icon-mask" v-if="isOpen"></div>
          <svg-icon :name="formState.assetsUrl" class="form-item-icon" @click="handleOpen"></svg-icon>
          <transition name="dropdown">
            <div v-if="isOpen" class="dropdown-menu">
              <!-- 菜单项 -->
              <div class="icon-list">
                <template v-for="iconIndex in 15" :key="iconIndex">
                  <svg-icon
                    :name="'template-cover-' + iconIndex"
                    class="icon"
                    @click="handleSelectIcon('template-cover-' + iconIndex)"
                  ></svg-icon>
                </template>
              </div>
            </div>
          </transition>
        </div>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <tiny-button type="primary" @click="confirm"> 确定 </tiny-button>
      <tiny-button @click="cancle">取消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Input as TinyInput,
  Button as TinyButton,
  DialogBox as TinyDialogBox,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Select as TinySelect,
  Notify
} from '@opentiny/vue'
import { fetchBusinessCategoryByGroup } from './js/http'

export default {
  components: {
    TinyInput,
    TinyButton,
    TinyDialogBox,
    TinyForm,
    TinyFormItem,
    TinySelect
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    template: {
      type: Object,
      default: () => ({})
    },
    openByTemplate: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm'],
  setup(props, { emit }) {
    const editAppInfoRef = ref()

    const formState = reactive({
      name: props.template.name || '',
      description: props.template.description || '',
      sceneId: props.template.sceneId || null,
      industryId: props.template.industryId || null,
      assetsUrl: props.template.assetsUrl || 'template-cover-1'
    })

    const isOpen = ref(false)

    const tagsList = reactive({
      scene: [],
      industry: []
    })

    const validRules = {
      name: [
        { required: true, message: '应用名称必填', trigger: 'blur' },
        { max: 50, message: '长度不大于50', trigger: 'change' },
        {
          trigger: 'blur',
          validator: (rule: any, value: string, callback: any) => {
            if (!/^[\w\-_]+$/.test(value)) {
              callback(new Error('应用名称只能包括英文、数字、中划线和下划线'))
            } else {
              callback()
            }
          }
        }
      ],
      description: [
        { max: 200, message: '长度不大于200', trigger: 'change' },
        {
          trigger: 'blur',
          validator: (rule: any, value: string, callback: any) => {
            if (!/^[\w\-_\u4e00-\u9fa5]*$/.test(value)) {
              callback(new Error('描述只能包括中文、英文、数字、中划线和下划线'))
            } else {
              callback()
            }
          }
        }
      ],
      sceneId: [{ required: true, message: '场景必选', trigger: 'change' }],
      industryId: [{ required: true, message: '行业必选', trigger: 'change' }]
    }

    const setVisible = (visible: boolean) => emit('update:visible', visible)

    const getTagsList = async () => {
      Promise.all([fetchBusinessCategoryByGroup('场景'), fetchBusinessCategoryByGroup('行业')])
        .then((res) => {
          tagsList.scene = res[0] || []
          tagsList.industry = res[1] || []
        })
        .catch((error) => {
          Notify({
            type: 'error',
            message: error,
            position: 'top-right',
            duration: 5000
          })
        })
    }

    const handleOpen = () => {
      isOpen.value = true
    }

    const handleSelectIcon = (icon: string) => {
      formState.assetsUrl = icon
      isOpen.value = false
    }

    const cancle = () => {
      isOpen.value = false
      setVisible(false)
    }

    const confirm = () => {
      editAppInfoRef.value.validate((valid: boolean) => {
        if (valid) {
          emit(
            'confirm',
            props.template?.id
              ? {
                  id: props.template.id,
                  ...formState
                }
              : formState
          )

          cancle()
        }
      })
    }

    onMounted(() => {
      getTagsList()
    })

    return {
      isOpen,
      editAppInfoRef,
      formState,
      validRules,
      tagsList,
      setVisible,
      handleOpen,
      handleSelectIcon,
      confirm,
      cancle
    }
  }
}
</script>

<style lang="less" scoped>
.form-item-icon-wrapper {
  position: relative;
  .form-item-icon {
    font-size: 40px;
    cursor: pointer;
  }
  .form-item-icon-mask {
    background-color: var(--te-app-center-mask-modal-bg-color);
    transition: background-color, 0.2s, ease-in-out;
    position: fixed;
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }
  .dropdown-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    padding: 16px;
    margin-bottom: 5px;
    width: 192px;
    border-radius: 4px;
    z-index: 1000;
    overflow: hidden;
    background: var(--te-template-common-bg-color);
    box-shadow: 0 4px 16px 0 var(--te-base-box-shadow-rgba-3);

    .icon-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 4px 0;
      .icon {
        font-size: 32px;
        cursor: pointer;
      }
    }
  }
}
</style>
