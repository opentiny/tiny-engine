<template>
  <div class="toolbar-wrap">
    <div class="toolbar-icon-wrap">
      <span
        v-for="(item, index) in state.media"
        :key="index"
        :class="['icon', { active: state.activeIndex === index, 'is-rotate': item.view === 'lanMobile' }]"
        @click="setViewPort(item)"
      >
        <tiny-popover trigger="hover" width="225" append-to-body :open-delay="1000" popper-class="media-icon-popover">
          <div class="media-content">
            <div class="media-title">
              <div>{{ item.title }}</div>
              <div v-if="item.subTitle" class="sub-title">
                （<svg-icon v-if="item.view === 'desktop'" name="stars"></svg-icon> <span>{{ item.subTitle }}</span
                >）
              </div>
            </div>
            <div class="content">{{ item.content }}</div>
          </div>
          <template #reference>
            <svg-icon :name="item.liked" class="media-icon"></svg-icon>
          </template>
        </tiny-popover>
      </span>
    </div>
    <tiny-popover v-if="isCanvas" width="290" trigger="click" popper-class="toolbar-media-popper">
      <template #reference>
        <tiny-popover
          trigger="hover"
          :open-delay="1000"
          popper-class="toolbar-right-popover"
          append-to-body
          content="画布设置"
        >
          <template #reference>
            <span class="reference-text">
              <span>
                <span>{{ parseInt(state.width) }}</span>
                <span class="symbol">PX</span>
              </span>
              <span>
                <span>{{ scale.toFixed(2) }}</span>
                <span class="symbol">%</span>
              </span>
            </span>
          </template>
        </tiny-popover>
      </template>
      <div class="content-wrap text-content">
        <span class="title text-title">{{ state.textData.title }}</span>
        <div class="setting">
          <div>
            <label for="">{{ state.textData.width }}</label>
            <tiny-input v-model="state.width" @change="widthChange">
              <template #suffix>
                <span>PX</span>
              </template>
            </tiny-input>
          </div>
          <div>
            <label for="">{{ state.textData.scale }}</label>
            <tiny-input v-model="state.scaleValue" :readonly="state.readonly" @change="scaleChange">
              <template #suffix>
                <span>%</span>
              </template>
            </tiny-input>
          </div>
        </div>

        <ul class="more-setting">
          <li>
            <div>
              <span>{{ '自由布局' }}</span>
            </div>
            <div>
              <tiny-switch v-model="isAbsolute" @change="changeCanvasType"></tiny-switch>
            </div>
          </li>
        </ul>
      </div>
    </tiny-popover>
  </div>
</template>

<script>
import { ref, reactive, computed, toRaw, watchEffect, onMounted, onUnmounted, watch } from 'vue'
import { Popover, Input, Switch } from '@opentiny/vue'
import { IconWebPlus } from '@opentiny/vue-icon'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { getCanvasType, setCanvasType } from '@opentiny/tiny-engine-canvas'

export default {
  components: {
    TinyPopover: Popover,
    TinyInput: Input,
    TinySwitch: Switch
  },
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    isCanvas: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    let timer = null
    let prevWidthVal = ''
    let prevScaleVal = ''
    const { layoutState } = useLayout()
    const visible = ref(false)
    const active = ref(false)
    const flag = ref(false)
    const isAbsolute = ref(getCanvasType() === 'absolute')

    const dimension = computed(() => useLayout().getDimension())
    const scale = computed(() => dimension.value.scale * 100)

    const state = reactive({
      activeIndex: 0,
      guideValue: '',
      width: '',
      scaleValue: '',
      readonly: false,
      viewWidth: null,
      moreData: {
        title: '添加大断点',
        list: [
          {
            icon: IconWebPlus(),
            text: '1280px'
          },
          {
            icon: IconWebPlus(),
            text: '1440px'
          },
          {
            icon: IconWebPlus(),
            text: '1920px'
          }
        ],
        tips: '将鼠标悬停在断点上以了解更多信息'
      },
      textData: {
        title: '画布设置',
        width: '宽度',
        scale: '缩放',
        list: [
          {
            text: '自由布局'
          }
        ],
        vision: '视觉预览'
      },
      guideOptions: [
        {
          value: '选项1',
          label: 'No guide'
        },
        {
          value: '选项2',
          label: 'Line guide(960px)'
        },
        {
          value: '选项3',
          label: 'Filled guide(960px)'
        }
      ],
      media: [
        {
          idx: 0,
          view: 'mdx',
          icon: 'IconDesktopView',
          liked: 'desktop-large',
          width: '1920px',
          minWidth: '1200px',
          maxWidth: '1920px',
          title: '大屏',
          subTitle: '1200px 及以上',
          content: '此处添加的样式将适用于 1200 像素及以上，除非它们在更大的断点处进行编辑',
          enContent: 'Style added here will apply at 1200px and up,unless they′re edited at a larger breakpoint'
        },
        {
          idx: 1,
          view: 'desktop',
          icon: 'IconDesktopView',
          liked: 'laptop-cut-corner',
          width: '1200px',
          minWidth: '992px',
          maxWidth: '1200px',
          title: 'PC 端',
          subTitle: '基本断点',
          content: '桌面端样式适用于所有断点，除非它们在更大或更小的断点处进行编辑，在这里开始你的布局。',
          enContent:
            'Desktop styles apply at all breakpoints,unless they′re edited at a larger or smaller breakpoints. Start your stying here.'
        },
        {
          idx: 2,
          view: 'tablet',
          icon: 'IconTabletView',
          liked: 'tablet-portrait',
          width: '992px',
          minWidth: '768px',
          maxWidth: '992px',
          title: '平板',
          subTitle: '992px 及以下',
          content: '此处添加的样式将适用于 992 像素及以下，除非它们在较小的断点处进行编辑。',
          enContent: 'styles added here will apply at 992px and down,unless they′re edited at smaller breakpoints.'
        },
        {
          idx: 3,
          view: 'lanMobile',
          icon: 'IconMobileView',
          liked: 'mobile-landscape',
          width: '768px',
          minWidth: '480px',
          maxWidth: '768px',
          title: '手机横屏',
          subTitle: '768px 及以下',
          content: '此处添加的样式将适用于 768 像素及以下，除非它们在较小的断点处进行编辑。',
          enContent: 'styles added here will apply at 768px and down,unless they′re edited at smaller breakpoints.'
        },
        {
          idx: 4,
          view: 'mobile',
          icon: 'IconMobileView',
          liked: 'mobile-portrai',
          width: '480px',
          minWidth: '240px',
          maxWidth: '480px',
          title: '手机竖屏',
          subTitle: '480px 及以下',
          content: '此处添加的样式将适用于 480 像素及以下。',
          enContent: 'styles added here will apply at 480px and down.'
        }
      ]
    })

    const hide = () => {
      active.value = false
    }

    const showTips = () => {
      timer = setTimeout(() => {
        visible.value = true
      }, 1000)
    }

    const hideTips = () => {
      visible.value = false
      clearTimeout(timer)
    }

    const showPopover = () => {
      layoutState.toolbars.visiblePopover = true
      flag.value = true
    }

    const hidePopover = () => {
      layoutState.toolbars.visiblePopover = false
      flag.value = false
    }

    const closePopover = (e) => {
      const ele = document.querySelector('.reference-text')
      const isChild = ele?.contains(e.target)

      if (ele !== e.target && !isChild) {
        layoutState.toolbars.visiblePopover = false
      }
    }

    const mediaMap = state.media.reduce((output, obj, index) => {
      output[obj.view] = { ...toRaw(obj), index }

      return output
    }, {})

    const setViewPort = (item) => {
      if (props.isCanvas) {
        useLayout().setDimension({
          deviceType: item.view,
          width: item.width,
          minWidth: item.minWidth,
          maxWidth: item.maxWidth
        })
      } else {
        state.activeIndex = item.idx
        emit('setViewPort', item.width)
      }
    }

    const activeView = (val, type) => {
      const item = mediaMap[type]
      useLayout().setDimension({
        deviceType: item.view,
        width: val ? `${val}px` : item.width,
        minWidth: item.minWidth,
        maxWidth: item.maxWidth
      })
    }

    const breakpoints = [
      { type: 'mobile', min: 240, max: 480 },
      { type: 'lanMobile', min: 480, max: 768 },
      { type: 'tablet', min: 768, max: 992 },
      { type: 'desktop', min: 992, max: 1200 },
      { type: 'mdx', min: 1200, max: 1920 }
    ]

    const widthChange = (val) => {
      const reg = /^\d+$/

      if (!String(val).match(reg)) {
        state.width = prevWidthVal ? prevWidthVal : parseInt(dimension.value.width, 10)
      } else if (Number(val) < 240) {
        state.width = 240
      } else if (Number(val) > 1920) {
        state.width = 1920
      } else {
        state.width = val
      }

      const width = Number(state.width)
      const type = breakpoints.find((item) => item.min <= width && width <= item.max)?.type || 'desktop'
      activeView(width, type)
    }

    const scaleChange = (val) => {
      const item = mediaMap['mdx']
      const reg = /^\d+(\.\d+)?$/

      if (!String(val).match(reg)) {
        state.scaleValue = prevScaleVal ? prevScaleVal : parseInt(item.scale)
      } else if (Number(val) > 100) {
        state.scaleValue = 100
      } else if (Number(val) < 20) {
        state.scaleValue = 20
      } else {
        state.scaleValue = val
      }
      state.scaleValue = Number(state.scaleValue).toFixed(2)

      useLayout().setDimension({
        scale: Number(state.scaleValue) / 100
      })
    }

    const changeCanvasType = (value) => {
      setCanvasType(value ? 'absolute' : 'normal')
    }

    watch(
      () => dimension.value.deviceType,
      (deviceType) => {
        state.activeIndex = mediaMap[deviceType].index
        state.readonly = deviceType !== 'mdx'
      }
    )

    watchEffect(() => {
      state.scaleValue = scale.value.toFixed(2)
      prevScaleVal = scale.value
    })

    watch(
      () => dimension.value.width,
      (width) => {
        const newWidth = parseInt(width, 10)
        if (Number.isInteger(newWidth)) {
          state.width = newWidth
          prevWidthVal = newWidth
        }
      }
    )

    onMounted(() => {
      document.addEventListener('click', closePopover)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closePopover)
    })

    // 初始化 viewpoint
    const mode = dimension.value.deviceType || 'desktop'
    setViewPort(mediaMap[mode])

    return {
      scale,
      state,
      active,
      flag,
      hide,
      layoutState,
      visible,
      showTips,
      hideTips,
      timer,
      dimension,
      setViewPort,
      showPopover,
      hidePopover,
      widthChange,
      scaleChange,
      isAbsolute,
      changeCanvasType
    }
  }
}
</script>

<style lang="less" scoped>
.toolbar-wrap {
  display: flex;
  align-items: center;

  .reference-text {
    cursor: pointer;
    height: var(--base-top-panel-height);
    line-height: var(--base-top-panel-height);
    padding: 0 7px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    display: inline-block;

    & > span {
      &:last-child {
        margin-left: 8px;
      }
    }
  }

  .toolbar-icon-wrap {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 6px;

    .icon {
      width: 32px;
      height: 32px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border-radius: 6px;

      svg {
        cursor: pointer;
        color: var(--ti-lowcode-toolbar-title-color);
        outline: none;
        width: 22px;
        height: 22px;
        margin-top: -0.5px;
      }

      &.active,
      &:hover {
        background: var(--ti-lowcode-toolbar-view-active-bg);
      }
      &.active {
        svg {
          color: var(--ti-lowcode-common-primary-color);
        }
      }
    }
  }

  .more-setting {
    .setting-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
    }
  }
}
</style>
