<template>
  <div class="background-group">
    <div class="background-image-wrap">
      <div class="background-image">
        <label
          :class="['background-label', { 'is-setting': getSettingFlag(BACKGROUND_PROPERTY.BackgroundImage) }]"
          @click="openSetting(BACKGROUND_PROPERTY.BackgroundImage, $event)"
        >
          <span>背景图 & 渐变</span>
        </label>
        <tiny-tooltip effect="dark" placement="top" content="添加背景图，线性渐变，径向渐变等">
          <div class="background-image-icon" @click="openBackgroundImageModal($event, { isAdd: true })">
            <icon-plus></icon-plus>
          </div>
        </tiny-tooltip>
      </div>
      <div v-if="state.backgroundImageList.length > 0" class="background-image-list">
        <div
          v-for="(item, index) in state.backgroundImageList"
          :key="index"
          :draggable="true"
          :class="[
            'image-list-item',
            item.forbiddenChildrenPointerEvents,
            item.dragStart ?? '',
            item.invisible ? 'image-list-item-invisible' : ''
          ]"
          @click="openBackgroundImageModal($event, { index })"
          @dragstart="handleDragstart($event, item, index)"
          @dragenter.prevent="handleDragenter($event, item, index)"
          @dragleave.prevent="handleDragleave($event, item)"
          @dragend="handleDragend($event, item, index)"
        >
          <span class="dragger-icon"><svg-icon name="dragger"></svg-icon></span>
          <div class="image-type">
            <span class="image" :style="{ backgroundImage: item.backgroundImage }"></span>
          </div>
          <span class="image-item-text">{{ item.text }}</span>
          <div class="icon-wrap">
            <span @click.stop="changeVisible(item, index)">
              <svg-icon v-if="item.invisible" name="eye-invisible"></svg-icon>
              <svg-icon v-else name="eye"></svg-icon>
            </span>
            <span @click.stop="deleteItem(index)"><svg-icon name="trash"></svg-icon></span>
          </div>
          <div v-show="item.draging" class="draging-bg"></div>
        </div>
      </div>
    </div>
    <div class="background-color">
      <label
        :class="['background-label', { 'is-setting': getSettingFlag(BACKGROUND_PROPERTY.BackgroundColor) }]"
        @click="openSetting(BACKGROUND_PROPERTY.BackgroundColor, $event)"
      >
        <span>颜色</span>
      </label>
      <color-configurator :modelValue="getProperty(BACKGROUND_PROPERTY.BackgroundColor).value" @change="changeColor" />
    </div>
    <div class="background-clip">
      <label
        :class="['background-label', { 'is-setting': getSettingFlag(BACKGROUND_PROPERTY.BackgroundClip) }]"
        @click="openSetting(BACKGROUND_PROPERTY.BackgroundClip, $event)"
      >
        <span>裁剪</span>
      </label>
      <div class="position-select">
        <select-configurator
          :modelValue="state.selectValue"
          :options="selectOptions"
          @update:modelValue="selectBackgroundClip"
        ></select-configurator>
      </div>
    </div>
  </div>
  <modal-mask v-if="state.showModal" @close="state.showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
  <modal-mask v-if="state.showBackgroundImageModal" teleport="body">
    <div class="background-model-title">
      <span>背景图 & 渐变设置</span>
      <svg-icon name="close" @click="state.showBackgroundImageModal = false"></svg-icon>
    </div>
    <background-image-setting
      :style="state.currentBackgroundImage"
      @update:modelValue="updateCurrentBackground"
    ></background-image-setting>
  </modal-mask>
</template>

<script>
import { reactive, watch } from 'vue'
import { Tooltip } from '@opentiny/vue'
import { ColorConfigurator, SelectConfigurator } from '@opentiny/tiny-engine-configurator'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { iconPlus } from '@opentiny/vue-icon'
import ModalMask, { useModal } from '../inputs/ModalMask.vue'
import ResetButton from '../inputs/ResetButton.vue'
import BackgroundImageSetting from './BackgroundImageSetting.vue'
import { useProperties } from '../../js/useStyle'
import { BACKGROUND_PROPERTY, TYPE_TEXT, PROPERTY_DEFAULT_VALUE } from '../../js/styleProperty'

// 顶层 schema 没有 id，所以指定一个 page-root-id 作为一个 key
const PAGE_ROOT_ID = 'page-root-id'

export default {
  components: {
    ColorConfigurator,
    ModalMask,
    ResetButton,
    SelectConfigurator,
    BackgroundImageSetting,
    TinyTooltip: Tooltip,
    IconPlus: iconPlus()
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    let activedName = []
    const selectOptions = [
      {
        label: 'None-无',
        value: 'none'
      },
      {
        label: 'padding-box 裁剪到padding',
        value: 'clip background to padding'
      },
      {
        label: 'content-box 裁剪到content',
        value: 'clip background to content'
      },
      {
        label: 'text 裁剪到文字',
        value: 'clip background to text'
      }
    ]

    const state = reactive({
      selectValue: 'none',
      showModal: false,
      showBackgroundImageModal: false,
      currentBackgroundImage: {},
      backgroundImageIndex: 0,
      backgroundImageList: [],
      cache: new Map()
    })

    const { getProperty, getSettingFlag } = useProperties({
      names: Object.values(BACKGROUND_PROPERTY),
      parseNumber: true
    })
    const { setPosition } = useModal()
    const { getCurrentSchema } = useCanvas()

    watch(
      () => props.style,
      () => {
        const currentSchemaId = getCurrentSchema()?.id || PAGE_ROOT_ID
        if (currentSchemaId) {
          state.backgroundImageList = state.cache.has(currentSchemaId) ? state.cache.get(currentSchemaId) : []
        }
      }
    )

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        if (name === 'background-clip') {
          activedName = [BACKGROUND_PROPERTY.BackgroundClip, BACKGROUND_PROPERTY.TextFillColor]
        } else if (name === 'background-image') {
          activedName = [
            BACKGROUND_PROPERTY.BackgroundImage,
            BACKGROUND_PROPERTY.BackgroundPosition,
            BACKGROUND_PROPERTY.BackgroundSize
          ]
        } else {
          activedName = [name]
        }

        setPosition(event)
        state.showModal = true
      }
    }

    const updateStyle = (property) => {
      const schemaId = getCurrentSchema()?.id || PAGE_ROOT_ID
      state.cache.set(schemaId, state.backgroundImageList)
      emit('update', property)
    }

    const reset = () => {
      activedName.forEach((name) => {
        updateStyle({ [name]: null })
      })

      state.showModal = false
      state.selectValue = 'none'
    }

    const getText = (type, backgroundImage) => {
      let text = TYPE_TEXT[type]
      if (type === 'ColorOverlay') {
        const color = /#[A-F0-9a-f]+/.exec(backgroundImage)?.at(0)
        text = color
      }
      return text
    }

    const getDefaultVal = (propertyName) => {
      return PROPERTY_DEFAULT_VALUE[propertyName]
    }

    const updateBackgroundImage = () => {
      const property = {
        [BACKGROUND_PROPERTY.BackgroundImage]: '',
        [BACKGROUND_PROPERTY.BackgroundPosition]: '',
        [BACKGROUND_PROPERTY.BackgroundSize]: '',
        [BACKGROUND_PROPERTY.BackgroundRepeat]: '',
        [BACKGROUND_PROPERTY.BackgroundAttachment]: ''
      }
      state.backgroundImageList.forEach(({ invisible, styleObj }, index) => {
        if (invisible) {
          return
        }
        Object.keys(property).forEach((key) => {
          property[key] += `${index === 0 || !property[key] ? '' : ','}${styleObj[key] ?? getDefaultVal(key)}`
        })
      })
      updateStyle(property)
    }

    const updateCurrentBackground = ({ type, ...styleObj }) => {
      const currentBackground = state.backgroundImageList.at(state.backgroundImageIndex)
      const text = getText(type, styleObj[BACKGROUND_PROPERTY.BackgroundImage])
      Object.assign(currentBackground.styleObj, styleObj)
      currentBackground.type = type
      currentBackground.text = text
      updateBackgroundImage()
    }

    const changeColor = (colorValue) => {
      const backgroundColor = BACKGROUND_PROPERTY.BackgroundColor
      const val = colorValue?.target?.value || colorValue || ''

      if (backgroundColor) {
        updateStyle({ [backgroundColor]: val })
      }
    }

    const selectBackgroundClip = (val) => {
      switch (val) {
        case 'clip background to padding':
          updateStyle({
            [BACKGROUND_PROPERTY.BackgroundClip]: 'padding-box',
            [BACKGROUND_PROPERTY.TextFillColor]: 'inherit'
          })
          break
        case 'clip background to content':
          updateStyle({
            [BACKGROUND_PROPERTY.BackgroundClip]: 'content-box',
            [BACKGROUND_PROPERTY.TextFillColor]: 'inherit'
          })
          break
        case 'clip background to text':
          updateStyle({
            [BACKGROUND_PROPERTY.BackgroundClip]: 'text',
            [BACKGROUND_PROPERTY.TextFillColor]: 'transparent'
          })
          break
        default:
          updateStyle({
            [BACKGROUND_PROPERTY.BackgroundClip]: 'border-box',
            [BACKGROUND_PROPERTY.TextFillColor]: 'inherit'
          })
          break
      }

      state.selectValue = val
    }

    const openBackgroundImageModal = (event, { isAdd, index }) => {
      if (isAdd) {
        const styleObj = {
          [BACKGROUND_PROPERTY.BackgroundImage]: 'linear-gradient(#000, #000)',
          [BACKGROUND_PROPERTY.BackgroundPosition]: null,
          [BACKGROUND_PROPERTY.BackgroundSize]: null,
          [BACKGROUND_PROPERTY.BackgroundRepeat]: null,
          [BACKGROUND_PROPERTY.BackgroundAttachment]: null
        }

        state.backgroundImageList.unshift({
          type: 'ColorOverlay',
          text: '#000',
          styleObj
        })
      }
      setPosition(event)
      state.showBackgroundImageModal = true
      state.backgroundImageIndex = isAdd ? 0 : index
      state.currentBackgroundImage = state.backgroundImageList[state.backgroundImageIndex]
      updateBackgroundImage()
    }

    const deleteItem = (index) => {
      state.backgroundImageList.splice(index, 1)
      updateBackgroundImage()
    }

    const changeVisible = (item) => {
      item.invisible = !item.invisible
      updateBackgroundImage()
    }

    let dragFrom = null
    let dragTo = null
    let dragToIndex = null
    const handleDragstart = (e, item) => {
      dragFrom = e.target
      setTimeout(() => {
        item.dragStart = 'drag-start'
      }, 0)
    }

    const handleDragenter = (e, item, index) => {
      if (!e.target.hasAttribute('draggable')) {
        return
      }
      if (e.target === dragFrom) {
        return
      }
      dragTo = e.target
      dragToIndex = index
      item.draging = true
      item.forbiddenChildrenPointerEvents = 'forbidden-children-pointer-events'
    }

    const handleDragleave = (e, item) => {
      if (!e.target.hasAttribute('draggable')) {
        return
      }
      item.draging = false
      item.forbiddenChildrenPointerEvents = ''
    }

    const handleDragend = (e, item, index) => {
      if (e.target === dragTo) {
        return
      }
      const dragItem = state.backgroundImageList[index]
      let addIndex = dragToIndex
      if (dragToIndex > index) {
        addIndex++
      }
      state.backgroundImageList.splice(addIndex, 0, dragItem)
      let deleteIndex = index
      if (dragToIndex < index) {
        deleteIndex++
      }
      state.backgroundImageList.splice(deleteIndex, 1)
      item.dragStart = ''
      updateBackgroundImage()
    }

    return {
      BACKGROUND_PROPERTY,
      state,
      selectOptions,
      updateStyle,
      updateCurrentBackground,
      openSetting,
      getProperty,
      getSettingFlag,
      reset,
      changeColor,
      selectBackgroundClip,
      deleteItem,
      changeVisible,
      handleDragstart,
      handleDragenter,
      handleDragleave,
      handleDragend,
      openBackgroundImageModal
    }
  }
}
</script>

<style lang="less" scoped>
.background-group {
  display: grid;
  gap: 12px 8px;
  grid-template-columns: 48px auto auto;
  align-items: center;
  position: relative;
  span {
    padding: 2px;
  }
  .background-label {
    color: var(--te-common-text-secondary);
  }
  .background-color,
  .background-clip {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-column: 1 / -1;
    grid-template-columns: 35px 1fr;
  }

  .background-image-wrap {
    grid-column: 1 / -1;
    position: relative;
    &::after {
      content: '';
      display: inline-block;
      width: calc(100% + 16px);
      height: 1px;
      background-color: var(--ti-lowcode-optionitem-background-color);
      position: absolute;
      left: -8px;
      bottom: 0px;
    }
  }

  .background-image-list {
    display: grid;
    place-items: stretch;
    gap: 1px;
    border-radius: 2px;
    border-top: 1px solid var(--te-common-border-divider);
    background-color: var(--te-common-bg-default);
    margin: 12px 0;
    .image-list-item {
      display: grid;
      grid-template-columns: 8px 16px minmax(auto, 1fr) auto;
      gap: 8px 4px;
      height: 24px;
      align-items: center;
      background-color: var(--te-common-bg-default);
      border-bottom: 1px solid var(--te-common-border-divider);
      pointer-events: all;
      font-size: 11px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
        'Helvetica Neue', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
      line-height: 16px;
      font-weight: 400;
      cursor: default;
      user-select: none;
      position: relative;
      overflow: visible;
      &:hover {
        background-color: var(--te-common-bg-container);
        .dragger-icon,
        .icon-wrap {
          opacity: 1;
        }
      }
      &.forbidden-children-pointer-events * {
        pointer-events: none;
      }
      &.drag-start {
        &::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background-color: var(--ti-lowcode-setting-style-drag-bar-bg);
        }
      }
      &.image-list-item-invisible {
        .image-type,
        .image-item-text {
          opacity: 0.5;
        }
      }
      .draging-bg {
        position: absolute;
        top: -1px;
        width: 100%;
        height: 3px;
        border-radius: 3px;
        background-color: var(--ti-lowcode-setting-style-drag-bar-bg);
      }
    }
    .dragger-icon {
      display: inline-flex;
      color: var(--te-common-icon-secondary);
      cursor: grab;
      width: 12px;
      opacity: 0;
      transition: 0.3s;
    }
    .image-type {
      position: relative;
      width: 10px;
      height: 10px;
      border-radius: 1px;
      margin: 1px;
      box-shadow: var(--te-common-border-default) 0px 0px 0px 1px;
      align-self: center;
      overflow: hidden;
      .image {
        position: absolute;
        inset: 0px;
        background-size: cover;
      }
    }
    .icon-wrap {
      display: flex;
      opacity: 0;
      transition: 0.3s;
      span {
        display: flex;
        justify-content: center;
        align-items: center;
        border-color: transparent;
        outline: 0px;
        cursor: default;
        user-select: none;
        height: 16px;
        width: 16px;
        max-height: 16px;
        border-width: 0px;
        color: var(--te-common-icon-secondary);
        background-color: transparent;
        border-radius: 2px;
        padding-left: 0px;
        padding-right: 0px;
        font-size: 13px;
      }
    }
  }

  .background-image {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    .background-image-icon {
      font-size: 16px;
      padding: 4px;
      &:hover svg {
        color: var(--te-common-icon-secondary);
      }
    }
  }

  .is-setting {
    span {
      cursor: pointer;
      border-radius: 2px;
      color: var(--te-common-text-emphasize);
      background-color: var(--te-common-bg-text-emphasize);
    }
  }
}

.background-model-title {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 6px 0;

  span {
    font-weight: 600;
    color: var(--te-common-text-primary);
  }

  .svg-icon {
    position: absolute;
    cursor: pointer;
    top: 0px;
    right: -4px;
  }
}
</style>
