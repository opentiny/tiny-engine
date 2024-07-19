<template>
  <div class="grid-box-container">
    <tiny-popover
      placement="top-start"
      width="240"
      popper-class="toolbar-media-popper grid-edit-popper"
      append-to-body
      @show="state.showMask = true"
      @hide="state.showMask = false"
    >
      <template #reference>
        <div class="grid-edit">
          <div class="grid-edit-btn">
            <svg-icon name="pencil-thick"></svg-icon>
            <span class="text">编辑网格</span>
            <span>●</span>
          </div>
        </div>
      </template>
      <div class="grid-edit-wrap">
        <div class="grid-edit-spacing">
          <div class="gap">
            <span
              :class="['gap-label', { 'is-setting': getGapSetting() }]"
              @click="openSetting(GRID_PROPERTY.GridGap, $event)"
              >间隔</span
            >
            <div class="gap-input">
              <numeric-select
                :name="getProperty(GRID_PROPERTY.GridColumnGap).name"
                :numericalText="getProperty(GRID_PROPERTY.GridColumnGap).text"
                @update="updateStyle"
              />
              <svg-icon :name="state.icon"></svg-icon>
              <numeric-select
                :name="getProperty(GRID_PROPERTY.GridRowGap).name"
                :numericalText="getProperty(GRID_PROPERTY.GridRowGap).text"
                @update="updateStyle"
              />
              <span :class="['col', { 'is-setting': getGapSetting() }]">列</span>
              <span :class="['row', { 'is-setting': getGapSetting() }]">行</span>
            </div>
          </div>
          <div class="direction">
            <span
              :class="['direction-label', { 'is-setting': getSettingFlag(GRID_PROPERTY.GridAutoFlow) }]"
              @click="openSetting(GRID_PROPERTY.GridAutoFlow, $event)"
              >方向</span
            >
            <radio-configurator
              :options="state.direction"
              :value="state.picked"
              :disabled="true"
              @pickedChange="select"
            ></radio-configurator>
          </div>
          <div class="dense">
            <input
              id="dense"
              v-model="state.densePicked"
              type="checkbox"
              name="dense"
              value="dense"
              @change="denseChange"
            />
            <label for="dense">Dense</label>
            <tiny-tooltip :open-delay="500" content="dense 表示尽可能紧密填满，尽量不出现空格">
              <icon-help-solid></icon-help-solid>
            </tiny-tooltip>
          </div>
        </div>
        <div class="grid-edit-layout">
          <div v-for="(item, index) in state.metaOptions" :key="index" class="layout-item">
            <div class="top">
              <span>{{ item.label }}</span>
              <component :is="item.icon" @click="addItem(item)"></component>
            </div>
            <meta-list-items :optionsList="item.list">
              <template #content="{ data }">
                <svg-icon :name="data.icon"></svg-icon>
                <span class="text">{{ data.text }}</span>
              </template>
              <template #operate="{ data }">
                <tiny-tooltip class="item" effect="dark" :open-delay="500" content="复制" placement="top">
                  <span class="item-icon">
                    <icon-copy @click="copyItem(item.list, data)"></icon-copy>
                  </span>
                </tiny-tooltip>
                <tiny-tooltip class="item" effect="dark" :open-delay="500" content="删除" placement="top">
                  <span class="item-icon">
                    <icon-del @click="deleteItem(item.list, data)"></icon-del>
                  </span>
                </tiny-tooltip>
              </template>
            </meta-list-items>
          </div>
        </div>
      </div>
    </tiny-popover>

    <div class="grid-item-wrap">
      <div v-for="(item, index) in state.gridOptions" :key="index" class="grid-item">
        <span
          :class="['grid-label', { 'is-setting': getPropSetting(item.title) }]"
          @click="openSetting(item.title, $event)"
          >{{ item.title }}</span
        >
        <div class="radio-wrap">
          <radio-configurator
            :options="item.align.list"
            :value="item.align.picked"
            @pickedChange="(args) => select(args, item.align)"
          ></radio-configurator>
          <radio-configurator
            :options="item.justify.list"
            :value="item.justify.picked"
            @pickedChange="(args) => select(args, item.justify)"
          ></radio-configurator>
        </div>
      </div>
    </div>
  </div>
  <modal-mask v-if="state.showModal" @close="state.showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
  <mask-modal :visible="state.showMask" @close="state.showMask = false"></mask-modal>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { MetaListItems, MaskModal } from '@opentiny/tiny-engine-common'
import { RadioConfigurator } from '@opentiny/tiny-engine-configurator'
import { iconHelpSolid, iconCopy, iconDel } from '@opentiny/vue-icon'
import { remove } from '@opentiny/vue-renderless/common/array'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import NumericSelect from '../inputs/NumericSelect.vue'
import { useProperties } from '../../js/useStyle'
import { GRID_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    RadioConfigurator,
    ModalMask,
    ResetButton,
    MetaListItems,
    NumericSelect,
    MaskModal,
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    IconHelpSolid: iconHelpSolid(),
    IconCopy: iconCopy(),
    IconDel: iconDel()
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    let activedName = []

    const { setPosition } = useModalMask()

    const state = reactive({
      showModal: false,
      isAlign: false,
      densePicked: false,
      showMask: false,
      icon: 'unlocked',
      picked: '',
      direction: [
        {
          value: 'grid-auto-flow:row',
          title: '',
          tip: '',
          text: '横向'
        },
        {
          value: 'grid-auto-flow:column',
          title: '',
          tip: '',
          text: '纵向'
        }
      ],
      gridOptions: [
        {
          title: '对齐',
          key: ['alignItems', 'justifyItems'],
          align: {
            picked: '',
            key: 'align-items',
            list: [
              {
                value: 'align-items:start',
                tip: 'start 辅轴起点对齐',
                icon: 'align-items-start'
              },
              {
                value: 'align-items:center',
                tip: 'center 辅轴居中对齐',
                icon: 'align-items-center'
              },
              {
                value: 'align-items:end',
                tip: 'end 辅轴终点对齐',
                icon: 'align-items-end'
              },
              {
                value: 'align-items:stretch',
                tip: 'stretch 辅轴拉伸对齐',
                icon: 'align-content-stretch'
              },
              {
                value: 'align-items:baseline',
                tip: 'baseline 辅轴基线对齐',
                icon: 'align-items-baseline'
              }
            ]
          },
          justify: {
            picked: '',
            key: 'justify-items',
            list: [
              {
                value: 'justify-items:start',
                tip: 'start 主轴起点对齐',
                icon: 'justify-items-start'
              },
              {
                value: 'justify-items:center',
                tip: 'center 主轴居中对齐',
                icon: 'justify-items-center'
              },
              {
                value: 'justify-items:end',
                tip: 'end 主轴终点对齐',
                icon: 'justify-items-end'
              },
              {
                value: 'justify-items:stretch',
                tip: 'stretch 主轴拉伸对齐',
                icon: 'justify-items-stretch'
              },
              {
                value: 'justify-items:baseline',
                tip: 'baseline 主轴基线对齐',
                icon: 'justify-items-baseline'
              }
            ]
          }
        },
        {
          title: '多行对齐',
          key: ['alignContent', 'justifyContent'],
          align: {
            picked: '',
            key: 'align-content',
            list: [
              {
                value: 'align-content:start',
                tip: 'start 辅轴起点对齐',
                icon: 'align-content-start'
              },
              {
                value: 'align-content:center',
                tip: 'center 辅轴居中对齐',
                icon: 'align-content-center'
              },
              {
                value: 'align-content:end',
                tip: 'end 辅轴终点对齐',
                icon: 'align-content-end'
              },
              {
                value: 'align-content:stretch',
                tip: 'stretch 辅轴拉伸对齐',
                icon: 'align-content-stretch'
              },
              {
                value: 'align-content:space-between',
                tip: 'Space Between 辅轴两端对齐',
                icon: 'align-content-space-between'
              },
              {
                value: 'align-content:space-around',
                tip: 'Space Around 辅轴均匀对齐',
                icon: 'align-content-space-around'
              }
            ]
          },
          justify: {
            picked: '',
            key: 'justify-content',
            list: [
              {
                value: 'justify-content:start',
                tip: 'Start 主轴起点对齐',
                icon: 'justify-content-start'
              },
              {
                value: 'justify-content:center',
                tip: 'Center 主轴居中对齐',
                icon: 'justify-content-center'
              },
              {
                value: 'justify-content:end',
                tip: 'End 主轴终点对齐',
                icon: 'justify-content-end'
              },
              {
                value: 'justify-content:stretch',
                tip: 'Stretch 主轴拉伸对齐',
                icon: 'justify-content-stretch'
              },
              {
                value: 'justify-content:space-between',
                tip: 'Space Between 主轴两端对齐',
                icon: 'justify-content-space-between'
              },
              {
                value: 'justify-content:space-around',
                tip: 'Space Around 主轴均匀对齐',
                icon: 'justify-content-space-around'
              }
            ]
          }
        }
      ],
      metaOptions: [
        {
          label: '列',
          icon: 'IconPlus',
          list: [
            {
              text: '1fr',
              icon: 'grid-column-flex'
            },
            {
              text: '1fr',
              icon: 'grid-column-flex'
            }
          ]
        },
        {
          label: '行',
          icon: 'IconPlus',
          list: [
            {
              text: 'Auto',
              icon: 'grid-row-auto'
            },
            {
              text: 'Auto',
              icon: 'grid-row-auto'
            }
          ]
        }
      ]
    })

    const { getProperty, getSettingFlag } = useProperties({
      names: Object.values(GRID_PROPERTY),
      parseNumber: true
    })

    const updateStyle = (property) => {
      emit('update', property)
    }

    const select = (type, item) => {
      if (type?.includes('grid-auto-flow')) {
        state.picked = type
      } else {
        item.picked = type
      }

      if (type?.includes(':')) {
        const styleArr = type.split(':')
        updateStyle({ [styleArr[0]]: styleArr[1] })
      }
    }

    const getPropSetting = (name) => {
      if (name === 'Align') {
        return getSettingFlag(GRID_PROPERTY.AlignItems) || getSettingFlag(GRID_PROPERTY.JustifyItems)
      } else {
        return getSettingFlag(GRID_PROPERTY.AlignContent) || getSettingFlag(GRID_PROPERTY.JustifyContent)
      }
    }

    const reInit = (name) => {
      let option = state.gridOptions.find((item) => item.title === name)
      option.align.picked = ''
      option.justify.picked = ''
    }

    const reset = () => {
      activedName.forEach((name) => {
        updateStyle({ [name]: null })
      })

      state.isAlign ? reInit('Align') : reInit('Distribute')
      state.picked = ''
      state.showModal = false
      state.isAlign = false
    }

    const getGapSetting = () => {
      return getSettingFlag(GRID_PROPERTY.GridColumnGap) || getSettingFlag(GRID_PROPERTY.GridRowGap)
    }

    const openSetting = (name, event) => {
      const isChange = getGapSetting() || getPropSetting(name) || getSettingFlag(name)

      if (isChange) {
        switch (name) {
          case 'Align':
            state.isAlign = true
            activedName = [GRID_PROPERTY.AlignItems, GRID_PROPERTY.JustifyItems]
            break
          case 'Distribute':
            activedName = [GRID_PROPERTY.AlignContent, GRID_PROPERTY.JustifyContent]
            break
          case 'grid-gap':
            activedName = [GRID_PROPERTY.GridRowGap, GRID_PROPERTY.GridColumnGap]
            break
          default:
            activedName = [name]
            break
        }

        setPosition(event)
        state.showModal = true
      }
    }

    const addItem = (item) => {
      if (item.label === 'Columns') {
        item.list?.push({ text: '1fr', icon: 'grid-column-flex' })
      } else {
        item.list?.push({ text: 'Auto', icon: 'grid-row-auto' })
      }
    }

    const copyItem = (list, data) => {
      list.push(data)
    }

    const deleteItem = (list, data) => {
      remove(list, data)
    }

    watchEffect(() => {
      const value = props.style
      if (value) {
        Object.keys(value).forEach((keys) => {
          state.gridOptions.forEach((item) => {
            if (item.key.includes(keys)) {
              keys.includes('align')
                ? (item.align.picked = `${item.align.key}:${value[keys]}`)
                : (item.justify.picked = `${item.justify.key}:${value[keys]}`)
            } else {
              item.picked = ''
            }
          })
        })
      }
    })

    return {
      state,
      GRID_PROPERTY,
      updateStyle,
      select,
      openSetting,
      getProperty,
      getPropSetting,
      getGapSetting,
      getSettingFlag,
      reset,
      addItem,
      copyItem,
      deleteItem
    }
  }
}
</script>

<style lang="less" scoped>
.grid-box-container {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 46px 1fr;
  & > span {
    grid-column: 2 / -1;
  }
  .grid-edit {
    width: 100%;
    padding: 8px 0;
    .grid-edit-btn {
      display: grid;
      column-gap: 4px;
      grid-template-columns: 22px 1fr 20px;
      place-items: center;
      position: relative;
      justify-content: center;
      align-self: center;
      height: 24px;
      padding: 0px 4px;
      border: 1px solid var(--ti-lowcode-tabs-border-color);
      border-radius: 2px;
      color: var(--ti-lowcode-grid-edit-color);
      background: var(--ti-lowcode-grid-edit-bg);
      outline: 0px;
      cursor: pointer;
      user-select: none;
      .text {
        grid-area: 1 / 2 / 2 / 3;
        justify-self: start;
      }
      .svg-icon {
        font-size: 16px;
      }
    }
  }
  .grid-item-wrap {
    grid-column: 1 / -1;
    grid-row-start: 3;
    .grid-item {
      display: grid;
      grid-template-columns: 46px 1fr;
      gap: 8px;
      & + .grid-item {
        margin-top: 8px;
      }
    }
    .grid-label {
      display: inline-block;
      height: 24px;
      line-height: 24px;
      padding-left: 3px;
      width: 54px;
    }
    .radio-wrap {
      display: grid;
      row-gap: 8px;
    }
  }
  .is-setting {
    color: var(--ti-lowcode-style-setting-label-color);
    background-color: var(--ti-lowcode-style-setting-label-bg);
  }
  :deep(.reference-wrapper) {
    width: 100%;
    display: inline-block;
  }
}
</style>
