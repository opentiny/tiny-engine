<template>
  <div class="background-image">
    <tiny-input v-model="imageInput" placeholder="none" class="image-conent" @change="imageChange">
      <template #suffix>
        <tiny-file-upload
          ref="upload"
          size="small"
          :show-file-list="false"
          :action="action"
          :before-upload="beforeUpload"
        >
          <template #trigger>
            <!-- <icon-fileupload /> -->
          </template>
        </tiny-file-upload>
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { toRefs, reactive } from 'vue'
import { Input, FileUpload } from '@opentiny/vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyInput: Input,
    TinyFileUpload: FileUpload
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      imageInput: props.modelValue,
      action: 'http://localhost:3000/api/upload'
    })

    const { setProp } = useProperties()

    const imageChange = (val) => {
      emit('change', val)
      setProp(props.name, val)
    }

    const beforeUpload = (file) => {
      state.imageInput = file.name
      return true
    }

    return {
      ...toRefs(state),
      imageChange,
      beforeUpload
    }
  }
}
</script>

<style lang="less" scoped>
.background-image {
  width: 100%;
  .icon {
    font-size: 20px;
    color: var(--te-styles-common-text-color-secondary);
    margin-right: 4px;
  }
}
</style>
