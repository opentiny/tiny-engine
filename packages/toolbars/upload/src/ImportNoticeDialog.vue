<template>
  <tiny-dialog-box
    class="import-notice-dialog"
    :visible="visible"
    :append-to-body="true"
    :modal="true"
    :lock-scroll="true"
    width="560px"
    :title="dialogTitle"
    @update:visible="onUpdateVisible"
  >
    <div class="summary">{{ summaryText }}</div>
    <div class="section">
      <div class="section-title">重点说明</div>
      <ul class="notice-list">
        <li class="notice-item" v-for="item in noticeItems" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>
    <template #footer>
      <tiny-button type="primary" @click="emitConfirm">继续导入</tiny-button>
      <tiny-button @click="emitCancel">取消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { DialogBox, Button } from '@opentiny/vue'

export default defineComponent({
  name: 'ImportNoticeDialog',
  components: {
    TinyDialogBox: DialogBox as any,
    TinyButton: Button as any
  },
  props: {
    visible: { type: Boolean, default: false },
    uploadType: { type: String, default: 'directory' }
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const importModeLabel = computed(() => (props.uploadType === 'zip' ? '项目压缩包' : '项目目录'))
    const dialogTitle = computed(() => `导入${importModeLabel.value}提醒`)
    const summaryText = computed(() =>
      props.uploadType === 'zip'
        ? '导入项目压缩包前，请确认压缩包内直接包含项目根结构，而不是只压缩 src 目录。若目录结构不符合约定，部分页面或配置会被跳过。'
        : '导入项目目录前，请确认你选择的是项目根目录，而不是 src 或其他子目录。若目录结构不符合约定，部分页面或配置会被跳过。'
    )
    const noticeItems = computed(() => {
      const modeSpecificItems =
        props.uploadType === 'zip'
          ? [
              '压缩包内应直接包含 src、public、package.json 等项目根文件，不建议只打包 src 目录。',
              '若压缩包里额外套了多层无关目录，固定路径可能匹配失败，导致页面、路由或资源识别不完整。'
            ]
          : [
              '请选择项目根目录，不要只选 src、views 或其他子目录。',
              '目录上传会按所选目录作为根路径解析；如果根目录选错，固定路径文件可能全部识别不到。'
            ]

      return [
        ...modeSpecificItems,
        '页面只会读取 src/views/**/*.vue，其他目录下的页面文件不会直接导入。',
        '页面里实际使用到的本地 .vue 子组件会转成区块，未使用的组件不会导入。',
        '路由、国际化、数据源、全局状态仅识别固定路径，如 src/router/index.js、src/i18n、src/lowcodeConfig/dataSource.json、src/stores/*.js。',
        '本地图片仅支持静态本地路径引用，远程地址和运行时拼接路径不会自动导入。',
        '若未识别到 src/views 页面，将不会创建页面，只会尽量导入全局配置、资源或区块。'
      ]
    })

    const emitConfirm = () => {
      emit('update:visible', false)
      emit('confirm')
    }

    const emitCancel = () => {
      emit('update:visible', false)
      emit('cancel')
    }

    const onUpdateVisible = (value: boolean) => emit('update:visible', value)

    return {
      importModeLabel,
      dialogTitle,
      summaryText,
      noticeItems,
      emitConfirm,
      emitCancel,
      onUpdateVisible
    }
  }
})
</script>

<style lang="less" scoped>
.import-notice-dialog {
  .summary {
    font-size: 12px;
    line-height: 20px;
    color: var(--te-toolbars-upload-text-color-primary);
    margin-bottom: 12px;
  }

  .section {
    padding: 12px;
    border-radius: 8px;
    background: var(--te-toolbars-upload-bg-color);
  }

  .section-title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--te-toolbars-upload-text-color-primary);
  }

  .notice-list {
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--te-toolbars-upload-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
  }

  .notice-item {
    position: relative;
    padding-left: 16px;
    display: flex;
    align-items: center;
  }

  .notice-item + .notice-item {
    margin-top: 8px;
    padding-top: 8px;
  }

  .notice-item::before {
    content: '';
    position: absolute;
    left: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--te-toolbars-upload-icon-color-primary);
  }

  code {
    padding: 0 4px;
    border-radius: 4px;
    color: var(--te-toolbars-upload-text-color-primary);
    background: var(--te-toolbars-upload-bg-color-primary);
  }
}
</style>
