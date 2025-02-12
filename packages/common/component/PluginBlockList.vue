<template>
  <div v-if="blockStyle === BlockStyles.Mini && showCheckbox" class="header">
    <div class="col-checkbox">
      <select-all :allItems="data" :selected="checked" :hidden-label="true" @select-all="handleSelectAll"></select-all>
    </div>
    <div class="col-name">区块名称</div>
    <div class="col-time">创建时间</div>
    <div class="col-created-by">创建人</div>
  </div>
  <ul
    v-if="state.data.length || showAddButton"
    :class="[
      'block-list',
      'lowcode-scrollbar',
      { 'is-small-list': blockStyle === BlockStyles.Mini },
      { isShortcutPanel }
    ]"
    @mouseleave="state.hover = false"
  >
    <li v-if="showAddButton" class="block-item block-plus" @click="$emit('add')">
      <span class="block-plus-icon"><svg-icon name="add"></svg-icon></span>
      <div class="item-text">添加区块</div>
    </li>
    <li
      v-for="(item, index) in state.data"
      :key="item.blockName"
      :draggable="!isBlockManage && showSettingIcon"
      :class="[
        'block-item',
        { 'is-disabled': showBlockDetail },
        { 'block-item-small-list': blockStyle === BlockStyles.Mini }
      ]"
      :title="getTitle(item)"
      @mousedown.stop.left="blockClick({ event: $event, item, index })"
      @mouseover.stop="openBlockShotPanel(item, $event)"
      @mouseleave="handleBlockItemLeave"
    >
      <slot :data="item">
        <plugin-block-item-img
          :item="item"
          :show-checkbox="showCheckbox"
          :checked="checked.some((block) => block.id === item.id)"
          :display-table="blockStyle === BlockStyles.Mini"
        ></plugin-block-item-img>
        <div class="item-text">
          <div class="item-name">{{ item.name_cn || item.label || item.content?.fileName }}</div>
          <div v-if="blockStyle === BlockStyles.List" class="item-description">{{ item.description }}</div>
        </div>

        <div v-if="isBlockManage && !item.is_published" class="publish-flag">未发布</div>

        <div v-if="isBlockManage" class="block-detail">
          <div class="setting-menu" @mouseover.stop="handleSettingMouseOver" @mouseleave="handleBlockItemLeave">
            <ul class="list">
              <li class="list-item" @mousedown.stop.left="editBlock({ event: $event, item, index })">
                <svg-button class="list-item-svg" :hoverBgColor="false" name="to-edit"> </svg-button>
              </li>
              <li
                class="list-item"
                @mouseover.stop="iconSettingMove"
                @mousedown.stop.prevent="iconClick({ event: $event, item, index })"
              >
                <svg-button class="list-item-svg" :hoverBgColor="false" name="setting"> </svg-button>
              </li>
            </ul>
          </div>
        </div>
        <div
          v-else-if="showSettingIcon"
          :class="['block-setting', { 'is-current-visible-icon': state.hoverItemId === item.id }]"
          title=" "
        >
          <div class="setting-menu" @mouseover.stop="handleSettingMouseOver" @mouseleave="handleBlockItemLeave">
            <ul class="list">
              <tiny-tooltip content="版本列表" placement="top" effect="light">
                <li class="list-item" @click.stop="$emit('openVersionPanel', { item, index })">
                  <svg-button class="list-item-svg" :hoverBgColor="false" name="versions"> </svg-button>
                </li>
              </tiny-tooltip>
              <tiny-tooltip content="移除" placement="top" effect="light">
                <li class="list-item" @click.stop="$emit('deleteBlock', item)">
                  <svg-button class="list-item-svg" :hoverBgColor="false" name="remove"> </svg-button>
                </li>
              </tiny-tooltip>
            </ul>
          </div>
        </div>
      </slot>
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
  <search-empty :isShow="!state.data.length && !showAddButton" />
</template>

<script>
import { computed, watch, inject, reactive } from 'vue'
import { format } from '@opentiny/vue-renderless/common/date'
import { Tooltip } from '@opentiny/vue'
import PluginBlockItemImg from './PluginBlockItemImg.vue'
import SearchEmpty from './SearchEmpty.vue'
import SvgButton from './SvgButton.vue'
import SelectAll from './SelectAll.vue'

const BlockStyles = {
  Default: 'default',
  Mini: 'mini',
  List: 'list'
}

const defaultImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAA11JREFUaEPtmUvIVVUYhp83CIJKpIsOEsSBAxEiEAwqRDGDBCmRkCwhwQQbSANDEbwNgvgzxEIUCwRBEB2EgiQR5MA/RcHImRBKkYhYaAliULzxwT6y3O1zzv735Rx+PN/srP1d3ve7rLX2PmKSiyY5fkYEhl3BUQVGFaiZgQdayPZTwOvA7Jp+2zI/C5yV9FcnQJ7AB8DetqI35HdM0qZuBL4HFjYUqC03pyUteigIPMC0rXSW8Ws77YzSFRgRKJPdMjqtVcD2DOC6pH/LAKmq0zgB2+uAXcCTwD1gs6Q9VQH2s2uDwO/A00ngv4EnJP3TD0zneZaEt4GvJB3uZdcoAdsBPAjkZaakX8sQsP0ecDDR/UhSVLRQGiUQEWzfAKYl0e4CU8rMgu0XgXMFSNdJ+rKIQRsE1gBjwDPAbWCLpH39sm97CvADMLeL7kpJR/PPGieQ9PGzkm72A57oB7i3Ev1vsstjZylmaJmkU6nP1giUBZ613U5gW2LzGzAHiEE+kKz/AbwhaTwhPtyT2PZK4EiO8MuSop1iprYAHyfPrwDLJV3Kng+PgO3ngZ9y4NdL2p9rk93Ah8naj8AKSVdbayHb0c+PASck/VkwfI8CASQd2v2S1nfZbeI8WJU8O53NzLHkmt/MZc72IWB1Fuxi9Lekk7ms5oe27wXR9rfAksTPCWAqsCBbq0/A9qfAxoIsfgJ8Lum67e3AjkQnzo55kq71Gn7bATZ6/oWc7fRGCNgO4EGgm5wJEkB+P18qKbbNvmI73smDxHMFytUrYDtaJlonldgeg9TjPZBtlPRZX+SJgu2XgJiBmKNUqhGw/RpwPBvajsMvJG2wvTQjcf9dNYkYl7X3JwK+o2v7TeDrnO0FSfM7a/mvEoX7bbYVxjDNTJwdlvRuEix2o61xtQYeydbHJb1SBXziN8inB93EKmA7hifA32cNnJIU34/+J7ajCu8AccWOgb5ch0DY2o6DbVbmZ8IEAvyyBMR54FVJd+oCK2tf+SADfgbWJoHid4D/pWzwJvSqEgiQac/fAhZLipN1oFKVQB7kEknfDRR5FqwJAoUvGoMi0wSBQWEtE6f0LlTG2TB0ehKY9J/XJ/cfHMPoh7oxR/9S1s1gXftRBepmsK79qAJ1M1jX/j/bzulAKB9d1wAAAABJRU5ErkJggg=='

export default {
  components: {
    TinyTooltip: Tooltip,
    PluginBlockItemImg,
    SvgButton,
    SearchEmpty,
    SelectAll
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
      default: BlockStyles.Default
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
    },
    // 是否显示多选框
    showCheckbox: {
      type: Boolean,
      default: false
    },
    // 选中的区块
    checked: {
      type: Array,
      default: () => []
    },
    gridColumns: {
      type: Number,
      default: 2
    }
  },
  emits: ['click', 'iconClick', 'add', 'deleteBlock', 'openVersionPanel', 'editBlock', 'checkAll', 'cancelCheckAll'],
  setup(props, { emit }) {
    const panelState = inject('panelState', {})
    const blockUsers = inject('blockUsers', [])
    const state = reactive({
      activeIndex: -1,
      data: computed(() => props.data),
      top: 0,
      hover: false,
      currentBlock: {},
      hoverItemId: null,
      currentShowMenuId: null,
      timeoutId: null
    })

    const users = computed(() => blockUsers?.value || [])

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

    const editBlock = ({ event, item, index }) => {
      state.activeIndex = index

      emit('editBlock', item)
      // 点击区块并不打开设置面板
      emit('iconClick', { event, item, index, isOpen: false })
    }

    const blockClick = ({ event, item, index }) => {
      if (props.isBlockManage) {
        editBlock({ event, item, index })
      }

      emit('click', item)
    }

    const iconClick = ({ event, item, index }) => {
      state.activeIndex = index

      emit('iconClick', { event, item, index, isOpen: true })
    }

    // 清除当前选择状态
    const clearActive = () => {
      state.activeIndex = -1
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

    const handleSelectAll = (items) => {
      if (Array.isArray(items)) {
        emit('checkAll', items)
      } else {
        emit('cancelCheckAll')
      }
    }

    return {
      BlockStyles,
      isShortcutPanel: panelState.isShortcutPanel,
      state,
      users,
      getTitle,
      blockClick,
      iconClick,
      clearActive,
      openBlockShotPanel,
      iconSettingMove,
      defaultImg,
      handleBlockItemLeave,
      handleSettingMouseOver,
      handleShowVersionMenu,
      editBlock,
      format,
      handleSelectAll
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
  border: 1px solid var(--te-common-border-default);
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

.header {
  display: flex;
  align-items: center;
  height: 24px;
  background-color: var(--te-common-bg-container);
  color: var(--te-common-text-secondary);
  position: sticky;
  top: 0;
  z-index: 100;

  & > div {
    padding: 0 8px;
    position: relative;
  }

  .col-time::before,
  .col-created-by::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 10px;
    background-color: var(--te-common-border-default);
  }
}

.col-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.col-checkbox,
.block-item-small-list:deep(.table-selection) {
  width: 40px;
}
.col-checkbox:deep(.tiny-checkbox__label) {
  padding: 0;
}
.col-name {
  width: 35%;
}
.col-time {
  width: 35%;
}
.col-created-by {
  flex: 1;
}

.block-list {
  display: grid;
  grid-template-columns: repeat(v-bind('gridColumns'), 1fr);
  position: relative;
  gap: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  color: var(--te-common-text-secondary);

  .block-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    height: 110px;
    user-select: none;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;

    .publish-flag {
      position: absolute;
      left: 4px;
      top: 4px;
      text-align: center;
      display: block;
      color: var(--te-common-text-primary);
      font-size: 12px;
      background-color: var(--te-common-bg-prompt);
      padding: 2px 4px;
      border-radius: 2px;
      transform: scale(0.9);
      min-width: 45px;
    }

    &.block-item-small-list {
      color: var(--te-common-text-primary);
      gap: 0;
      &:deep(.block-item-img) {
        width: 54px;
        height: 40px;
        flex: unset;
        margin-left: 8px;
      }
      .item-text {
        width: 50%;
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
      }
      &:hover {
        background-color: var(--te-common-bg-container);
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
      background: var(--ti-lowcode-component-block-list-item-active-bg);
    }

    &.is-disabled {
      & + .block-plus:hover {
        background: transparent;
        cursor: inherit;
      }
    }

    &:not(.is-disabled):hover {
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
      .block-plus-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 86px;
        border: 1px dashed var(--te-common-border-hover);
        border-radius: 4px;
      }
      .item-text {
        font-size: 12px;
      }
      .svg-icon {
        font-size: 24px;
        color: var(--ti-lowcode-component-svg-button-color);
      }

      &:hover {
        cursor: pointer;
        color: var(--ti-lowcode-component-svg-button-hover-color);
      }
    }

    .item-default-img {
      width: 84px;
      height: 50px;
      color: var(--te-common-bg-default);
    }

    .item-text {
      color: var(--te-common-text-secondary);
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
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
      top: 1px;
      right: 6px;
      z-index: 9;
      &.is-current-visible-icon {
        visibility: visible;
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

    .block-item {
      height: 54px;
      flex-direction: row;
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

    .cell {
      padding: 0 8px;
      text-align: start;
    }
    .cell-time {
      width: 35%;
    }
    .cell-created-by {
      flex: 1;
    }
  }
}
.setting-menu {
  font-size: 12px;
  color: var(--ti-lowcode-component-block-setting-item-text-color);
  .list {
    display: flex;
  }
  .list-item {
    box-sizing: border-box;
    cursor: pointer;
    &:hover {
      color: var(--te-common-text-primary);
    }
    .list-item-icon {
      font-size: 14px;
      color: var(--te-common-icon-secondary);
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
