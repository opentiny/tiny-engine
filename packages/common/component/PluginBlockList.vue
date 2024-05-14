<template>
  <ul
    v-if="state.data.length"
    :class="['block-list', 'lowcode-scrollbar', { 'is-small-list': blockStyle === 'mini' }, { isShortcutPanel }]"
    @mouseleave="state.hover = false"
  >
    <li
      v-for="(item, index) in state.data"
      :key="item.blockName"
      :draggable="!isBlockManage && showSettingIcon"
      :class="[
        'block-item',
        { 'is-active': state.activeIndex === index },
        { 'is-disabled': showBlockDetail },
        { 'block-item-small-list': blockStyle === 'mini' }
      ]"
      :title="getTitle(item)"
      @mousedown.stop.left="blockClick({ event: $event, item, index })"
      @mouseover.stop="openBlockShotPanel(item, $event)"
      @mouseleave="handleBlockItemLeave"
    >
      <slot :data="item">
        <img
          v-if="item.screenshot"
          class="item-image"
          :src="item.screenshot || defaultImg"
          draggable="false"
          @error="$event.target.src = defaultImg"
        />
        <svg-icon v-else class="item-image item-default-img" name="block-default-img"></svg-icon>
        <div class="item-text">
          <div class="item-name">{{ item.name_cn || item.label || item.content?.fileName }}</div>
          <div v-if="blockStyle === 'list'" class="item-description">{{ item.description }}</div>
        </div>

        <div v-if="item.isShowProgress" class="progress-bar">
          <tiny-progress
            :text-inside="true"
            :stroke-width="8"
            :percentage="item.publishProgress"
            status="success"
          ></tiny-progress>
        </div>

        <div v-if="isBlockManage && !item.is_published" class="publish-flag">未发布</div>

        <div v-if="isBlockManage" class="block-detail">
          <tiny-tooltip effect="dark" :content="defaultIconTip" placement="top">
            <icon-setting
              class="block-detail-icon"
              @mouseover.stop="iconSettingMove"
              @mousedown.stop.prevent="iconClick({ event: $event, item, index })"
            ></icon-setting>
          </tiny-tooltip>
        </div>
        <div
          v-else-if="showSettingIcon"
          :class="['block-setting', { 'is-current-visible-icon': state.hoverItemId === item.id }]"
          title=" "
        >
          <tiny-popover
            v-if="!item.isDefaultGroup"
            placement="bottom-end"
            width="151"
            append-to-body
            trigger="manual"
            :modelValue="state.hoverItemId === item.id && state.currentShowMenuId === item.id"
            :visible-arrow="false"
            popper-class="popper-options block-setting-popover"
          >
            <template #reference>
              <svg-button
                name="ellipsis"
                class="block-detail-icon"
                @click="handleShowVersionMenu(item)"
                @mouseover.stop="iconSettingMove"
                @mousedown.stop.prevent=""
              ></svg-button>
            </template>
            <template #default>
              <div class="setting-menu" @mouseover.stop="handleSettingMouseOver" @mouseleave="handleBlockItemLeave">
                <ul class="list">
                  <li class="list-item" @click="$emit('openVersionPanel', { item, index })">
                    <span>版本列表</span>
                  </li>
                  <li class="list-item" @click="$emit('deleteBlock', item)">
                    <span>移除</span>
                  </li>
                </ul>
              </div>
            </template>
          </tiny-popover>
        </div>
        <div
          v-if="item.isAnimation"
          :class="[
            'deploy',
            { success: item.deployStatus === taskStatus.FINISHED },
            {
              error: item.deployStatus === taskStatus.STOPPED
            }
          ]"
          @mouseover.stop="item.isAnimation = false"
        >
          {{ deployTips[item.deployStatus] }}
        </div>
      </slot>
    </li>
    <li v-if="state.showAddButton" class="block-item block-plus" @click="$emit('add')">
      <span class="block-plus-icon"><icon-plus></icon-plus></span>
    </li>
    <div v-if="showBlockShot && state.hover && state.currentBlock.screenshot" class="block-shortcut">
      <div class="block-shortcut-title">{{ state.currentBlock.label }}预览图</div>
      <div v-if="state.currentBlock.description" class="block-shortcut-description">
        {{ state.currentBlock.description }}
      </div>
      <div class="block-shortcut-image-wrapper">
        <img
          class="block-shortcut-image"
          :src="state.currentBlock.screenshot || defaultImg"
          @error="$event.target.src = defaultImg"
        />
      </div>
    </div>
  </ul>
  <search-empty :isShow="!state.data.length" />
</template>

<script>
import { computed, watch, inject, reactive } from 'vue'
import { iconSetting, iconPlus } from '@opentiny/vue-icon'
import { Tooltip, Progress, Popover } from '@opentiny/vue'
import SearchEmpty from './SearchEmpty.vue'
import SvgButton from './SvgButton.vue'

const defaultImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAA11JREFUaEPtmUvIVVUYhp83CIJKpIsOEsSBAxEiEAwqRDGDBCmRkCwhwQQbSANDEbwNgvgzxEIUCwRBEB2EgiQR5MA/RcHImRBKkYhYaAliULzxwT6y3O1zzv735Rx+PN/srP1d3ve7rLX2PmKSiyY5fkYEhl3BUQVGFaiZgQdayPZTwOvA7Jp+2zI/C5yV9FcnQJ7AB8DetqI35HdM0qZuBL4HFjYUqC03pyUteigIPMC0rXSW8Ws77YzSFRgRKJPdMjqtVcD2DOC6pH/LAKmq0zgB2+uAXcCTwD1gs6Q9VQH2s2uDwO/A00ngv4EnJP3TD0zneZaEt4GvJB3uZdcoAdsBPAjkZaakX8sQsP0ecDDR/UhSVLRQGiUQEWzfAKYl0e4CU8rMgu0XgXMFSNdJ+rKIQRsE1gBjwDPAbWCLpH39sm97CvADMLeL7kpJR/PPGieQ9PGzkm72A57oB7i3Ev1vsstjZylmaJmkU6nP1giUBZ613U5gW2LzGzAHiEE+kKz/AbwhaTwhPtyT2PZK4EiO8MuSop1iprYAHyfPrwDLJV3Kng+PgO3ngZ9y4NdL2p9rk93Ah8naj8AKSVdbayHb0c+PASck/VkwfI8CASQd2v2S1nfZbeI8WJU8O53NzLHkmt/MZc72IWB1Fuxi9Lekk7ms5oe27wXR9rfAksTPCWAqsCBbq0/A9qfAxoIsfgJ8Lum67e3AjkQnzo55kq71Gn7bATZ6/oWc7fRGCNgO4EGgm5wJEkB+P18qKbbNvmI73smDxHMFytUrYDtaJlonldgeg9TjPZBtlPRZX+SJgu2XgJiBmKNUqhGw/RpwPBvajsMvJG2wvTQjcf9dNYkYl7X3JwK+o2v7TeDrnO0FSfM7a/mvEoX7bbYVxjDNTJwdlvRuEix2o61xtQYeydbHJb1SBXziN8inB93EKmA7hifA32cNnJIU34/+J7ajCu8AccWOgb5ch0DY2o6DbVbmZ8IEAvyyBMR54FVJd+oCK2tf+SADfgbWJoHid4D/pWzwJvSqEgiQac/fAhZLipN1oFKVQB7kEknfDRR5FqwJAoUvGoMi0wSBQWEtE6f0LlTG2TB0ehKY9J/XJ/cfHMPoh7oxR/9S1s1gXftRBepmsK79qAJ1M1jX/j/bzulAKB9d1wAAAABJRU5ErkJggg=='

export default {
  components: {
    TinyProgress: Progress,
    TinyTooltip: Tooltip,
    IconSetting: iconSetting(),
    IconPlus: iconPlus(),
    TinyPopover: Popover,
    SvgButton,
    SearchEmpty
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    /*
      列表样式，可选择为 default || list || mini  默认值为 default
    */
    blockStyle: {
      type: String,
      default: 'default'
    },
    /*
    用于区分是否是区块管理侧的列表
    */
    isBlockManage: {
      type: Boolean,
      default: false
    },
    /*
      是否显示新增按钮
    */
    showAddButton: {
      type: Boolean,
      default: false
    },
    /*
      是否显示区块详情弹框
    */
    showBlockDetail: {
      type: Boolean,
      default: false
    },
    /*
      是否显示快照
    */
    showBlockShot: {
      type: Boolean,
      default: false
    },
    /*
    默认 ICON 的提示文字
    */
    defaultIconTip: {
      type: String,
      default: ''
    },
    // 是否显示历史备份按钮
    showSettingIcon: {
      type: Boolean,
      default: true
    },
    // 外部传入的区块信息：不通过区块列表里点击展示，而是从外面直接调起区块面板展示的区块。
    externalBlock: {
      type: Object,
      default: null
    }
  },
  emits: ['click', 'iconClick', 'add', 'deleteBlock', 'openVersionPanel'],
  setup(props, { emit }) {
    const panelState = inject('panelState', {})
    const state = reactive({
      activeIndex: -1,
      data: computed(() => props.data),
      showAddButton: computed(() => props.showAddButton),
      top: 0,
      hover: false,
      currentBlock: {},
      hoverItemId: null,
      currentShowMenuId: null,
      timeoutId: null
    })

    const getParentNode = (el) => {
      while (el.nodeName !== 'LI') {
        el = el.parentNode
      }
      return el
    }

    const openBlockShotPanel = (item, event) => {
      state.currentBlock = item

      state.top = `${getParentNode(event.target).getBoundingClientRect().top}px`

      state.hover = true
      state.hoverItemId = item.id

      if (state.currentShowMenuId === item.id) {
        clearTimeout(state.timeoutId)
      }
    }

    const blockClick = ({ event, item, index }) => {
      if (props.isBlockManage) {
        state.activeIndex = index
      }

      emit('click', item)
      // 点击区块并不打开设置面板
      emit('iconClick', { event, item, index, isOpen: false })
    }

    const iconClick = ({ event, item, index }) => {
      state.activeIndex = index

      emit('iconClick', { event, item, index, isOpen: true })
    }

    // 清除当前选择状态
    const clearActive = () => {
      state.activeIndex = -1
    }

    // 区块发布任务说明
    const taskStatus = {
      RUNNING: 1,
      STOPPED: 2,
      FINISHED: 3
    }

    const deployTips = {
      1: '正在发布中',
      2: '发布失败，请重新发布',
      3: '发布完成'
    }

    const iconSettingMove = () => {
      state.hover = false
    }

    const getTitle = (item) => (item.groupName ? `分组: ${item.groupName + '\n'}` : '') + (item.label || item.blockName)

    const handleBlockItemLeave = () => {
      state.timeoutId = setTimeout(() => {
        state.hoverItemId = null
        state.currentShowMenuId = null
      }, 200)
    }

    const handleSettingMouseOver = () => {
      clearTimeout(state.timeoutId)
    }

    const handleShowVersionMenu = (item) => {
      if (state.currentShowMenuId) {
        state.currentShowMenuId = null
      } else {
        state.currentShowMenuId = item.id
      }
    }

    // 若是存在外部区块：即不通过区块列表里点击展示，而是从外面直接调起区块面板展示的区块，
    // 那么当前高亮的所选中的区块需要切换成外部区块
    const changeActiveIndex = (blockList, block) => {
      const blockIndex = blockList.findIndex((item) => item.id === block.id)
      state.activeIndex = blockIndex
    }

    watch(
      () => props.data,
      async (blockList) => {
        if (blockList && props.externalBlock) {
          changeActiveIndex(blockList, props.externalBlock)
        }
      }
    )

    watch(
      () => props.externalBlock,
      async (block) => {
        if (block && state.data?.length) {
          changeActiveIndex(state.data, block)
        }
      }
    )

    return {
      isShortcutPanel: panelState.isShortcutPanel,
      state,
      getTitle,
      blockClick,
      iconClick,
      clearActive,
      taskStatus,
      deployTips,
      openBlockShotPanel,
      iconSettingMove,
      defaultImg,
      handleBlockItemLeave,
      handleSettingMouseOver,
      handleShowVersionMenu
    }
  }
}
</script>

<style lang="less" scoped>
.block-shortcut {
  position: fixed;
  z-index: 9999;
  top: 50px;
  left: calc(var(--base-left-panel-width) + var(--base-nav-panel-width) + 10px);
  max-width: 500px;
  max-height: 136px;
  padding: 12px;
  background: var(--ti-lowcode-component-block-list-shortcut-bg);
  border-radius: 5px;
  border: 1px solid var(--ti-lowcode-common-border-color-4);
  top: v-bind('state.top');
  .block-shortcut-title {
    color: var(--ti-lowcode-component-block-list-shortcut-title-color);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .block-shortcut-description {
    color: var(--ti-lowcode-component-block-list-item-color);
    margin-bottom: 20px;
    font-size: 12px;
  }
  .block-shortcut-image-wrapper {
    height: 80px;
    overflow: hidden;
  }
  .block-shortcut-image {
    width: 100%;
    object-fit: contain;
  }
}

.block-list {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: repeat(auto-fill, 96px);
  position: relative;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  color: var(--ti-lowcode-common-secondary-text-color);

  &.is-small-list {
    grid-template-columns: 100%;
    grid-template-rows: repeat(auto-fill, 30px);
  }
  .block-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    height: 96px;
    padding: 10px;
    border-right: 1px solid var(--ti-lowcode-component-block-list-border-color);
    border-bottom: 1px solid var(--ti-lowcode-component-block-list-border-color);
    text-align: center;
    user-select: none;
    &:nth-child(-n + 2) {
      border-top: 1px solid var(--ti-lowcode-component-block-list-border-color);
    }
    &.block-item-small-list:nth-child(2) {
      border-top: none;
    }

    .publish-flag {
      position: absolute;
      left: 2px;
      top: 2px;
      text-align: center;
      display: block;
      color: var(--ti-lowcode-common-secondary-text-color);
      font-size: 12px;
      background-color: var(--ti-lowcode-component-block-list-item-tag-bg);
      padding: 2px;
      border-radius: 4px 0 4px 0;
      transform: scale(0.9);
    }

    &.block-item-small-list {
      flex-direction: row;
      align-items: center;
      height: 30px;
      padding: 4px 10px;
      .item-image {
        width: 30px;
        height: 30px;
        min-width: 30px;
      }
      .item-text {
        text-align: left;
        margin-top: 0;
        margin-left: 4px;
      }
      .publish-flag {
        position: static;
      }
      .block-detail,
      .block-setting {
        visibility: hidden;
        position: static;
        margin-left: 4px;
        z-index: 9;
        .block-detail-icon {
          color: var(--ti-lowcode-component-block-list-setting-btn-color);
          display: block;
          &:hover {
            cursor: pointer;
            color: var(--ti-lowcode-component-block-list-setting-btn-hover-color);
          }
        }
      }
    }
    &:nth-child(even) {
      border-right: 0;
    }

    :deep(.tiny-progress.is-success .tiny-progress-bar__inner) {
      animation-duration: 5s;
      animation-name: roll;
      animation-iteration-count: infinite;
      animation-timing-function: linear;
    }

    :deep(.tiny-progress-bar__innerText) {
      display: none;
    }

    .progress-bar {
      width: 100%;
    }

    &.is-active {
      background: var(--ti-lowcode-component-block-list-item-active-bg, --ti-lowcode-canvas-wrap-bg);
    }

    &.is-disabled {
      & + .block-plus:hover {
        background: transparent;
        cursor: inherit;
      }
    }

    &:not(.is-disabled):hover {
      background-color: var(--ti-lowcode-component-block-list-item-active-bg);
      cursor: pointer;

      .block-detail,
      .block-setting {
        visibility: visible;
      }

      &[draggable='true'] {
        cursor: move;
      }
    }

    &.block-plus {
      display: flex;
      justify-content: center;
      align-items: center;
      .tiny-svg {
        font-size: 24px;
        color: var(--ti-lowcode-component-svg-button-color);
      }

      &:hover {
        cursor: pointer;
        color: var(--ti-lowcode-component-svg-button-hover-color);
      }
    }

    .item-image {
      width: 100px;
      height: 48px;
      overflow: hidden;
      object-fit: cover;
    }
    .item-default-img {
      width: 50px;
      height: 50px;
    }

    .item-text {
      color: var(--ti-lowcode-component-block-list-item-color);
      text-align: center;
      flex: 1;
      margin-top: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .item-name {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 12px;
    }

    .block-detail,
    .block-setting {
      visibility: hidden;
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 9;
      &.is-current-visible-icon {
        visibility: visible;
      }

      .block-detail-icon {
        color: var(--ti-lowcode-component-block-list-setting-btn-color);
        &:hover {
          cursor: pointer;
          color: var(--ti-lowcode-component-block-list-setting-btn-hover-color);
        }
      }
    }
    .block-setting {
      right: 0px;
      top: 0;
    }
  }

  .deploy {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 114px;
    color: var(--ti-lowcode-toolbar-icon-color);
    font-weight: bold;
    vertical-align: middle;
    text-align: center;
    margin: -10px -11px;
    padding: 40px 10px;
  }

  .loading {
    animation-duration: 5s;
    animation-name: roll;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    background: repeating-linear-gradient(
      135deg,
      rgba(39, 115, 214, 0.6) 0px,
      rgba(39, 115, 214, 0.6) 10px,
      rgba(255, 255, 255, 0.6) 10px,
      rgba(255, 255, 255, 0.6) 20px
    );
  }

  .success {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 10px;
    animation: greenGrow 800ms ease-out 10 alternate;
    background: rgb(55 68 58 / 60%);
  }

  .error {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 10px;
    animation: redGrow 800ms ease-out 20 alternate;
    background: rgb(86 52 52 / 60%);
  }

  @keyframes roll {
    from {
      background-position: 0 0;
    }

    to {
      background-position: 128px 0;
    }
  }

  @keyframes greenGrow {
    0% {
      box-shadow: inset 0px 0px 3px green;
    }
    100% {
      box-shadow: inset 0px 0px 7px green;
    }
  }

  @keyframes redGrow {
    0% {
      box-shadow: inset 0px 0px 3px red;
    }
    100% {
      box-shadow: inset 0px 0px 7px red;
    }
  }

  &.isShortcutPanel {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    height: 300px;
    .block-item {
      .item-text {
        width: 100px;
      }
    }
  }

  &.is-small-list {
    display: block;
    grid-template-columns: initial;

    .block-item {
      flex-direction: row;
      border-right: none;
    }

    .item-image {
      padding: 0;
      flex-shrink: 0;
    }

    .item-text {
      margin-top: 0;
      padding: 0 8px;
      text-align: left;

      .item-name {
        font-size: 12px;
        line-height: 16px;
      }
      .item-description {
        color: var(--ti-lowcode-toolbar-title-color);
        font-size: 12px;
      }
    }
  }

  &.is-small-list {
    .block-item {
      height: 38px;
    }

    .item-image {
      font-size: 1.5em;
      width: 27px;
      height: 22px;
    }

    .item-text {
      width: calc(100% - 35px);
    }
  }
}
.setting-menu {
  font-size: 12px;
  color: var(--ti-lowcode-component-block-setting-item-text-color);
  .list {
    margin-top: 6px;
  }
  .list-item {
    box-sizing: border-box;
    padding: 16px 18px;
    height: 30px;
    line-height: 30px;
    cursor: pointer;
    span {
      margin-left: 8px;
    }
    display: flex;
    align-items: center;
    &:hover {
      background-color: var(--ti-lowcode-component-block-setting-item-hover-bg);
      color: var(--ti-lowcode-common-primary-text-color);
    }
    .list-item-icon {
      font-size: 14px;
    }
  }
}
</style>

<style lang="less">
.tiny-popover.tiny-popper.popper-options.block-setting-popover {
  background-color: var(--ti-lowcode-component-block-setting-popover-bg);
  display: flex;
  flex-direction: column;
  padding: 0;
  .popper__arrow,
  .popper__arrow::after {
    border-bottom-color: var(--ti-lowcode-component-block-setting-popover-bg);
  }
}
</style>
