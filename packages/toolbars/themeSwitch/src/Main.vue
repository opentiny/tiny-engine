<template>
  <div class="toolbar-theme-switch">
    <tiny-popover
      width="130"
      trigger="manual"
      v-model="showpopover"
      :visible-arrow="false"
      popper-class="theme-popover"
    >
      <div class="theme-list">
        <div
          v-for="item in THEME_DATA"
          :key="item.type"
          :class="['theme-item', { active: state.theme === item.type }]"
          @click="themeItemChange(item.type)"
        >
          {{ item.text }}
        </div>
      </div>
      <template #reference>
        <toolbar-base :content="baseContent" :icon="baseIcon" :options="optionsData" @click-api="changeThemeType">
          <template v-if="position === 'collapse'">
            <div class="toolbar-theme-switch-radio">
              <div class="toolbar-theme-switch-radio-title">主题</div>
              <tiny-radio-group
                v-model="state.theme"
                :options="radioThemeList"
                :vertical="themeShowType ? false : true"
                class="theme-radio-group"
                @change="themeChange"
              >
              </tiny-radio-group>
            </div>
          </template>
        </toolbar-base>
      </template>
    </tiny-popover>
  </div>
</template>

<script>
/* metaService: engine.toolbars.themeSwitch.Main */
import { computed, ref } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { TinyRadioGroup, TinyPopover } from '@opentiny/vue'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    ToolbarBase,
    TinyRadioGroup,
    TinyPopover
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    },
    position: {
      type: String,
      default: 'right'
    }
  },
  setup(props) {
    const { getThemeData, getThemeState, themeChange, getTheme } = getMetaApi(META_SERVICE.ThemeSwitch)
    const state = getThemeState()
    const THEME_DATA = getThemeData()
    const COLLAPSE = 'collapse'
    const optionsData = computed(() => {
      const options = { ...props.options }
      if (props.position === COLLAPSE) {
        options.renderType = ''
      }

      return options
    })
    const radioThemeList = computed(() => {
      return THEME_DATA.value.map((item) => ({ ...item, label: item.type }))
    })
    const baseContent = computed(() => (props.position === COLLAPSE ? '' : state.themeLabel))
    const baseIcon = computed(() => (props.position === COLLAPSE ? '' : state.themeIcon))
    const showpopover = ref(false)

    const themeShowType = computed(() => {
      const filterList = THEME_DATA.value.filter((item) => ['light', 'dark'].includes(item.type)) || []
      return THEME_DATA.value.length === filterList.length
    })

    const toChangeTheme = () => {
      const theme = getTheme(state.theme).oppositeTheme
      themeChange(theme)
    }

    const changeThemeType = () => {
      if (props.position === COLLAPSE) {
        return
      }
      if (themeShowType.value) {
        toChangeTheme()
      } else {
        showpopover.value = true
      }
    }

    const themeItemChange = (theme) => {
      themeChange(theme)
      showpopover.value = false
    }

    return {
      THEME_DATA,
      state,
      optionsData,
      radioThemeList,
      baseContent,
      baseIcon,
      toChangeTheme,
      themeChange,
      showpopover,
      themeShowType,
      themeItemChange,
      changeThemeType
    }
  }
}
</script>
<style lang="less" scoped>
.theme-list {
  .theme-item {
    padding: 4px 16px;
    margin: 0 -16px;
    &:hover {
      background-color: var(--te-toolbar-theme-popover-list-item-bg-color-hover);
    }
  }
  .active {
    background-color: var(--te-toolbar-theme-popover-list-item-bg-color-active);
  }
}
</style>
