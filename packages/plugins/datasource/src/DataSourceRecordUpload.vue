<template>
  <!-- 批量导入 -->
  <tiny-modal v-model="state.upload.showImportModal" title="导入提示" show-footer>
    <template #default>
      <span class="import-tip">仅支持xlsx格式，大小不超过4MB</span>
    </template>
    <template #footer>
      <div class="import-tip-action">
        <tiny-file-upload
          ref="upload"
          size="small"
          action="/"
          accept="xlsx"
          :before-upload="beforeUpload"
          :show-file-list="false"
          :limit="1"
        >
          <template #trigger>
            <tiny-button @click="closeImportModal">{{ state.upload.importLabel }}</tiny-button>
          </template>
        </tiny-file-upload>
        <tiny-button class="ml4" @click="closeImportModal">取消</tiny-button>
      </div>
    </template>
  </tiny-modal>
  <!-- 二次确认 -->
  <tiny-modal v-model="state.upload.importConfirm" title="导入提示" show-footer>
    <template #default>
      <div class="import-tip">
        <span>{{ state.upload.importSuccessLabel }}</span>
        <span class="confirm">是否要覆盖之前的数据？</span>
      </div>
    </template>
    <template #footer>
      <tiny-button @click="overrideData">覆盖</tiny-button>
      <tiny-button class="ml4" @click="mergeData">合并</tiny-button>
    </template>
  </tiny-modal>
  <!-- 校验失败 -->
  <tiny-modal v-model="state.upload.showImportFail" title="导入提示" show-footer>
    <template #default>
      <div v-if="state.upload.typeError" class="import-tip">
        <span class="confirm">格式有误</span>
        <span>，只支持xlsx文件</span>
      </div>

      <div v-if="state.upload.sizeExceed" class="import-tip">
        <span class="confirm">当前文件已超出限制</span>
        <span>，最大不超过4MB</span>
      </div>
    </template>
    <template #footer>
      <tiny-file-upload
        ref="upload"
        size="small"
        action="/"
        accept="xlsx"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :limit="1"
      >
        <template #trigger>
          <tiny-button type="danger" @click="closeImportFailModal">重新导入</tiny-button>
        </template>
      </tiny-file-upload>
      <tiny-button class="ml4" @click="closeImportFailModal">取消</tiny-button>
    </template>
  </tiny-modal>
</template>

<script>
import { reactive, watch } from 'vue'
import { Button, Modal, FileUpload } from '@opentiny/vue'
import { getDataFromFile } from './js/datasource'
import { IconHelp } from '@opentiny/vue-icon'

const MIME_TYPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const FILE_SIZE_MAX = 4

export default {
  components: {
    TinyButton: Button,
    TinyModal: Modal,
    TinyFileUpload: FileUpload
  },
  props: {
    showImportModal: {
      type: Boolean,
      default: false
    }
  },
  emits: ['override', 'merge', 'close'],
  setup(props, { emit }) {
    const state = reactive({
      upload: {
        showImportModal: false,
        importLabel: '导入',
        importSuccessLabel: '',
        importConfirm: false,
        showImportFail: false,
        typeError: false,
        sizeExceed: false,
        importData: []
      }
    })
    const importSuccessLabel = '共导入{0}条数据，'

    const closeImportModal = () => {
      state.upload.showImportModal = false
      emit('close')
    }

    const closeImportFailModal = () => {
      state.upload.showImportFail = false
      emit('close')
    }

    const beforeUpload = async (file) => {
      const typeValid = file.type === MIME_TYPE_XLSX
      const sizeValid = file.size / 1024 / 1024 < FILE_SIZE_MAX
      const isValid = typeValid && sizeValid
      if (isValid) {
        state.upload.importConfirm = true
      } else {
        state.upload.typeError = !typeValid
        state.upload.sizeExceed = !sizeValid
        state.upload.showImportFail = true
      }
      closeImportModal()

      const data = await getDataFromFile(file)
      state.upload.importData = data
      state.upload.importSuccessLabel = importSuccessLabel.replace('{0}', state.upload.importData.length)

      return false
    }

    const closeConfirmModal = () => {
      state.upload.importConfirm = false
      closeImportFailModal()
    }

    const overrideData = () => {
      closeConfirmModal()
      emit('override', {
        importData: state.upload.importData
      })
    }
    const mergeData = () => {
      closeConfirmModal()
      emit('merge', {
        importData: state.upload.importData
      })
    }

    watch(
      () => props.showImportModal,
      () => {
        state.upload.showImportModal = props.showImportModal
      }
    )

    return {
      state,
      beforeUpload,
      overrideData,
      mergeData,
      closeImportModal,
      closeImportFailModal,
      IconHelp: IconHelp()
    }
  }
}
</script>

<style lang="less" scoped>
.import-tip {
  font-size: 12px;
  line-height: 17px;
}
.import-tip-action {
  display: flex;
  justify-content: center;
}
.ml4 {
  margin-left: 10px;
}
.confirm {
  color: var(--te-datasource-common-color-error);
}
</style>
