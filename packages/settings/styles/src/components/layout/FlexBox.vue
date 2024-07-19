<template>
  <div class="container-flex">
    <div v-for="(item, index) in layoutOpts" :key="index" class="flex-item">
      <span
        :class="['title', { 'is-setting': getSettingFlag(hyphenate(item.key)) }]"
        @click="openSetting(hyphenate(item.key), $event)"
        >{{ item.title }}</span
      >
      <div>
        <radio-configurator
          :options="item.btnList"
          :value="item.picked"
          @pickedChange="(args) => select(args, item)"
        ></radio-configurator>
      </div>
    </div>
  </div>
  <modal-mask v-if="showModal" @close="showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { RadioConfigurator } from '@opentiny/tiny-engine-configurator'
import { utils } from '@opentiny/tiny-engine-utils'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import { useProperties } from '../../js/useStyle'
import { FLEX_PROPERTY } from '../../js/styleProperty'

const { hyphenate } = utils

export default {
  components: {
    RadioConfigurator,
    ModalMask,
    ResetButton
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    let activedName = ''
    const layoutOpts = ref([
      {
        title: '主轴方向',
        picked: '',
        key: 'flexDirection',
        btnList: [
          {
            value: 'flex-direction:row',
            title: '',
            tip: '水平方向，起点在左侧 row',
            icon: 'flex-directionrow'
          },
          {
            value: 'flex-direction:row-reverse',
            title: '',
            tip: '水平方向，起点在右侧 row-reverse',
            icon: 'flex-directionrow-reverse'
          },
          {
            value: 'flex-direction:column',
            title: '',
            tip: '垂直方向，起点在上沿 column',
            icon: 'flex-directioncolumn'
          },
          {
            value: 'flex-direction:column-reverse',
            title: '',
            tip: '垂直方向，起点在下沿 column-reverse',
            icon: 'flex-directioncolumn-reverse'
          }
        ]
      },
      {
        title: '主轴对齐',
        picked: '',
        key: 'justifyContent',
        btnList: [
          {
            value: 'justify-content:flex-start',
            title: '',
            tip: '左对齐 flex-start',
            icon: 'flex-justifyflex-startrow'
          },
          {
            value: 'justify-content:flex-end',
            title: '',
            tip: '右对齐 flex-end',
            icon: 'flex-justifyflex-endrow'
          },
          {
            value: 'justify-content:center',
            title: '',
            tip: '水平居中 center',
            icon: 'flex-justifycenterrow'
          },
          {
            value: 'justify-content:space-between',
            title: '',
            tip: '两端对齐 space-between',
            icon: 'flex-justifyspace-betweenrow'
          },
          {
            value: 'justify-content:space-around',
            title: '',
            tip: '横向平分 space-around',
            icon: 'flex-justifyspace-aroundrow'
          }
        ]
      },
      {
        title: '辅轴对齐',
        picked: '',
        key: 'alignItems',
        btnList: [
          {
            value: 'align-items:flex-start',
            title: '',
            tip: '起点对齐 flex-start',
            icon: 'flex-alignflex-startrow'
          },
          {
            value: 'align-items:flex-end',
            title: '',
            tip: '终点对齐 flex-end',
            icon: 'flex-alignflex-endrow'
          },
          {
            value: 'align-items:center',
            title: '',
            tip: '水平居中 center',
            icon: 'flex-aligncenterrow'
          },
          {
            value: 'align-items:baseline',
            title: '',
            tip: '项目第一行文字的基线对齐 baseline',
            icon: 'flex-alignbaselinerow'
          },
          {
            value: 'align-items:stretch',
            title: '',
            tip: '沾满整个容器的高度 stretch',
            icon: 'flex-alignstretchrow'
          }
        ]
      },
      {
        title: '换行模式',
        picked: '',
        key: 'flexWrap',
        btnList: [
          {
            value: 'flex-wrap:nowrap',
            title: '不换行',
            tip: '不换行 nowrap'
          },
          {
            value: 'flex-wrap:wrap',
            title: '正换行',
            tip: '第一行在上方 wrap'
          },
          {
            value: 'flex-wrap:wrap-reverse',
            title: '逆换行',
            tip: '第一行在下方 wrap-reverse'
          }
        ]
      }
    ])
    const { setPosition } = useModalMask()
    const showModal = ref(false)

    const { getSettingFlag } = useProperties({
      names: Object.values(FLEX_PROPERTY),
      parseNumber: true
    })

    const updateStyle = (property) => {
      emit('update', property)
    }

    const select = (type, item) => {
      item.picked = type
      if (type?.includes(':')) {
        const styleArr = type.split(':')
        updateStyle({ [styleArr[0]]: styleArr[1] })
      }
    }

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        activedName = name
        setPosition(event)
        showModal.value = true
      }
    }

    const reset = () => {
      updateStyle({ [activedName]: null })
      showModal.value = false
    }

    watchEffect(() => {
      const value = props.style
      if (value) {
        layoutOpts.value.forEach((item) => {
          if (value[item.key]) {
            item.picked = `${hyphenate(item.key)}:${value[item.key]}`
          } else {
            item.picked = ''
          }
        })
      }
    })

    return {
      layoutOpts,
      showModal,
      hyphenate,
      getSettingFlag,
      select,
      openSetting,
      reset
    }
  }
}
</script>

<style lang="less" scoped>
.container-flex {
  margin-top: 10px;
}
.flex-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
}
.title {
  margin-right: 10px;
}
.flex-item :deep(.radio-button) {
  padding: 5px;
}
.is-setting {
}
</style>
