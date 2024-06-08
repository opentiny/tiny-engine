<template>
  <tiny-config-provider>
    <div id="tiny-engine">
      <div class="tiny-engine-toolbar">
        <div class="toolbar-left">
          <component :is="item.component" v-for="item in leftBar" :key="item.id"></component>
        </div>
        <div class="toolbar-center">
          <component :is="item.component" v-for="item in centerBar" :key="item.id"></component>
        </div>
        <div class="toolbar-right">
          <component :is="item.component" v-for="item in rightBar" :key="item.id"></component>
        </div>
      </div>
      <div class="progress">
        <progress-bar v-if="state.showDeployBlock"></progress-bar>
      </div>

      <div class="tiny-engine-main">
        <div class="tiny-engine-left-wrap">
          <div class="tiny-engine-content-wrap">
            <div id="tiny-engine-nav-panel" :style="{ 'pointer-events': pluginState.pluginEvent }">
              <ul class="nav-panel-lists top">
                <li
                  v-for="(item, index) in state.topNavLists"
                  :key="index"
                  :class="{
                    'list-item': true,
                    'first-item': index === 0,
                    active: item.id === renderPanel,
                    prev: state.prevIdex - 1 === index
                  }"
                  :title="item.title"
                  @click="clickMenu({ item, index })"
                >
                  <div>
                    <span class="item-icon">
                      <svg-icon
                        v-if="typeof iconComponents[item.id] === 'string'"
                        :name="iconComponents[item.id]"
                        class="panel-icon"
                      ></svg-icon>
                      <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
                    </span>
                  </div>
                </li>
              </ul>
              <ul class="nav-panel-lists bottom">
                <li style="flex: 1" class="list-item"></li>
                <li
                  v-for="(item, index) in state.bottomNavLists"
                  :key="index"
                  :class="[
                    'list-item',
                    { active: renderPanel === item.id, prev: state.prevIdex - 1 === index, 'first-item': index === 0 }
                  ]"
                  :title="item.title"
                  @click="clickMenu({ item, index })"
                >
                  <div :class="{ 'is-show': renderPanel }">
                    <span class="item-icon">
                      <public-icon
                        v-if="typeof iconComponents[item.id] === 'string'"
                        :name="iconComponents[item.id]"
                        class="panel-icon"
                        svgClass="panel-svg"
                      ></public-icon>
                      <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
                    </span>
                  </div>
                </li>
                <li
                  v-if="state.independence"
                  :key="state.bottomNavLists.length + 1"
                  :class="['list-item']"
                  :title="state.independence.title"
                  @click="openAIRobot"
                >
                  <div>
                    <span class="item-icon">
                      <img class="chatgpt-icon" src="../assets/AI.png" />
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div
              v-show="renderPanel && components[renderPanel]"
              id="tiny-engine-left-panel"
              :class="[renderPanel, { 'is-fixed': pluginsState.fixedPanels.includes(renderPanel) }]"
            >
              <div class="left-panel-wrap">
                <keep-alive>
                  <component
                    :is="components[renderPanel]"
                    ref="pluginRef"
                    :fixed-panels="pluginsState.fixedPanels"
                    @close="close"
                    @fixPanel="fixPanel"
                  ></component>
                </keep-alive>
              </div>
            </div>
            <!--  AI 悬浮窗  -->
            <Teleport to="body">
              <div v-if="robotVisible" class="robot-dialog">
                <keep-alive>
                  <component :is="robotComponent" @close-chat="robotVisible = false"></component>
                </keep-alive>
              </div>
            </Teleport>

            <div id="canvas-wrap" ref="canvasRef">
              <div ref="siteCanvas" class="site-canvas" :style="siteCanvasStyle">
                <component
                  :is="state.canvas.CanvasContainer.component"
                  :controller="controller"
                  :materials-panel="materialsPanel"
                  :canvas-src="canvasUrl"
                  @remove="removeNode"
                  @selected="nodeSelected"
                >
                </component>
              </div>
              <component :is="state.canvas.CanvasFooter.component" :data="footData" @click="selectFooterNode">
              </component>
            </div>
          </div>
        </div>
        <div class="tiny-engine-right-wrap">
          <div v-show="layoutState.settings.showDesignSettings" ref="right" id="tiny-right-panel">
            <tiny-tabs v-model="layoutState.settings.render" tab-style="button-card">
              <tiny-tab-item
                v-for="(setting, index) in state.settings"
                :key="index"
                :title="setting.title"
                :name="setting.name"
              >
                <component :is="setting.component"></component>
                <div v-show="activating" class="active"></div>
              </tiny-tab-item>
            </tiny-tabs>
          </div>
        </div>
      </div>
    </div>
  </tiny-config-provider>
</template>

<script lang="jsx">
/* metaService */
import './index.less'
import { ref, reactive, watch, nextTick, computed, onUnmounted } from 'vue'
import { ConfigProvider, Popover, Tooltip, Tabs, TabItem } from '@opentiny/vue'
// import designSmbConfig from '@opentiny/vue-design-smb'
import { ProgressBar, PublicIcon } from '@opentiny/tiny-engine-common'
import {
  useProperties,
  useCanvas,
  useLayout,
  useResource,
  useHistory,
  useModal,
  usePage
} from '@opentiny/tiny-engine-controller'
import materials from '@opentiny/tiny-engine-plugin-materials'
import { useHttp } from '@opentiny/tiny-engine-http'
import { constants } from '@opentiny/tiny-engine-utils'
import { isVsCodeEnv, isDevelopEnv } from '@opentiny/tiny-engine-controller/js/environments'
import * as ast from '@opentiny/tiny-engine-controller/js/ast'

const { PAGE_STATUS } = constants
const tenant = new URLSearchParams(location.search).get('tenant') || ''
const canvasUrl =
  isVsCodeEnv || isDevelopEnv
    ? `canvas.html?tenant=${tenant}`
    : window.location.origin + window.location.pathname + `/canvas?tenant=${tenant}`

const componentType = {
  Block: '区块',
  Page: '页面'
}

export default {
  components: {
    ProgressBar,
    PublicIcon,
    TinyConfigProvider: ConfigProvider,
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },
  props: {
    registry: {
      type: Object,
      default: () => ({})
    },
    renderPanel: {
      type: String
    }
  },
  emits: ['plugin-click'],
  setup(props, { emit }) {
    const leftBar = []
    const rightBar = []
    const centerBar = []

    const footData = ref([])
    const showMask = ref(true)
    const canvasRef = ref(null)
    let showModal = false // 弹窗标识

    const {
      PLUGIN_NAME,
      pluginState,
      registerPluginApi,
      layoutState,
      layoutState: { plugins: pluginsState }
    } = useLayout()
    const activating = computed(() => layoutState.settings.activating)

    const components = {}
    const iconComponents = {}
    const pluginRef = ref(null)
    const robotVisible = ref(false)
    const robotComponent = ref(null)
    const { isTemporaryPage } = usePage()
    const completed = ref(false)

    props.registry.plugins.forEach(({ id, component, api, icon }) => {
      components[id] = component
      iconComponents[id] = icon
      if (api) {
        registerPluginApi({
          [id]: api
        })
      }
    })

    const state = reactive({
      plugins: props.registry.plugins,
      toolbars: props.registry.toolbars,
      settings: props.registry.settings,
      canvas: props.registry.canvas,
      showDeployBlock: false,
      prevIdex: -2,
      topNavLists: props.registry.plugins.filter((item) => item.align === 'top'),
      bottomNavLists: props.registry.plugins.filter((item) => item.align === 'bottom'),
      independence: props.registry.plugins.find((item) => item.align === 'independence')
    })

    state.toolbars.forEach((item) => {
      if (item.align === 'right') {
        rightBar.push(item)
      } else if (item.align === 'center') {
        centerBar.push(item)
      } else {
        leftBar.push(item)
      }
      if (item.id === 'lock') {
        useLayout().registerPluginApi({ Lock: item.api })
      }
      if (item.id === 'save') {
        useLayout().registerPluginApi({ save: item.api })
      }
    })
    nextTick(() => {
      state.showDeployBlock = true
    })

    // canvas
    const removeNode = (node) => {
      const { pageState } = useCanvas()
      footData.value = useCanvas().canvasApi.value.getNodePath(node?.id)
      pageState.currentSchema = {}
      pageState.properties = null
    }

    const siteCanvasStyle = computed(() => {
      const { scale } = useLayout().getDimension()
      return {
        height: `calc((100% - var(--base-bottom-panel-height, 30px) - 36px) / ${scale})`,
        transform: `scale(${scale})`
      }
    })

    watch(
      [() => useCanvas().isSaved(), () => useLayout().layoutState.pageStatus, () => useCanvas().getPageSchema()],
      ([isSaved, pageStatus, pageSchema], [oldIsSaved, _oldPageStatus, oldPageSchema]) => {
        if (
          [PAGE_STATUS.Guest, PAGE_STATUS.Occupy].includes(useLayout().layoutState.pageStatus.state) ||
          !pageSchema?.componentName
        ) {
          return
        }

        const pageInfo = pageStatus?.data
        const message = {
          empty: () => '应用下暂无页面，需新建页面后体验画布功能',
          release: (type) => `当前${componentType[type]}未锁定，点击右上角 “锁定” 图标后编辑${componentType[type]}`,
          lock: (type) =>
            `当前${componentType[type]}被 ${pageInfo?.username} ${pageInfo?.resetPasswordToken} 锁定，如需编辑请先联系他解锁文件，然后再锁定该${componentType[type]}后编辑！`
        }

        const renderMsg = message[pageStatus.state](pageSchema.componentName)
        // 两种情况进行提示，
        // 1. 页面或区块状态是未保存状态（尝试编辑）
        // 2. 页面刷新或第一次进入页面(含从别的页面或区块切换到别的页面或区块)
        // 3. 页面上已经有弹窗，不允许重复弹窗

        const showConfirm = !isSaved || pageSchema !== oldPageSchema

        if (!showConfirm || showModal) {
          return
        }

        // 状态重置
        const resetState = () => {
          useHistory().go(-1, false)
          useCanvas().setSaved(true)
          removeNode()
        }

        // callback 是撤销上一步的操作
        // 只有当从已保存状态变成未保存状态的时候，即尝试编辑的时候，才撤销上一步的操作
        const callback = () => {
          showModal = false
          if (!isSaved && oldIsSaved) {
            resetState()
          }
        }

        showModal = true
        useModal().confirm({
          title: '提示',
          message: renderMsg,
          status: 'info',
          exec: callback,
          cancel: callback,
          hide: () => {
            showModal = false
          }
        })
      }
    )

    const nodeSelected = (node, parent, type) => {
      const { toolbars } = useLayout().layoutState
      if (type !== 'clickTree') {
        useLayout().closePlugin()
      }

      const { getSchema, getNodePath } = useCanvas().canvasApi.value

      const schema = getSchema()
      // 如果选中的节点是画布，就设置成默认选中最外层schema
      useProperties().getProps(node || schema, parent)
      useCanvas().setCurrentSchema(node || schema)
      footData.value = getNodePath(node?.id)
      toolbars.visiblePopover = false
    }

    const selectFooterNode = ({ node }) => {
      const { selectNode } = useCanvas().canvasApi.value

      selectNode(node)
    }

    let canvasResizeObserver = null
    watch(
      () => [useCanvas().isCanvasApiReady.value, canvasRef.value],
      ([ready]) => {
        if (!ready || !canvasRef.value) {
          return
        }

        // 先取消监听，再增加监听事件，避免重复监听
        document.removeEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
        canvasResizeObserver?.disconnect?.()

        document.addEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
        canvasResizeObserver = new ResizeObserver(useCanvas().canvasApi.value.updateRect).observe(canvasRef.value)
      }
    )

    onUnmounted(() => {
      document.removeEventListener('canvasResize', useCanvas().canvasApi.value.updateRect)
      canvasResizeObserver?.disconnect?.()
    })

    // plugins
    const doCompleted = () => {
      if (!completed.value) {
        completed.value = true
        useLayout().closePlugin()
      }
    }

    const clickMenu = ({ item, index }) => {
      if (item.id === PLUGIN_NAME.EditorHelp) return
      state.prevIdex = index

      // 切换插件与关闭插件时确认
      const lastPlugin = state.plugins.find((item) => item.id === props.renderPanel)
      if (props.renderPanel && lastPlugin?.confirm) {
        const confirmCallback = (result) =>
          result &&
          emit('plugin-click', {
            item,
            navLists: item.align === 'top' ? state.topNavLists[index] : state.bottomNavLists[index]
          })

        pluginRef.value?.[lastPlugin.confirm](confirmCallback)
      } else {
        emit('plugin-click', {
          item,
          navLists: item.align === 'top' ? state.topNavLists[index] : state.bottomNavLists[index]
        })
      }
    }
    watch(isTemporaryPage, () => {
      if (isTemporaryPage.saved) {
        const pagePanel = state.topNavLists?.find((item) => item.id === PLUGIN_NAME.AppManage) || null
        const pageIndex = state.topNavLists?.findIndex((item) => item.id === PLUGIN_NAME.AppManage) || -1
        if (pagePanel !== props.renderPanel) {
          clickMenu({ item: pagePanel, index: pageIndex })
        }
      }
    })

    const openAIRobot = () => {
      robotComponent.value = components[PLUGIN_NAME.Robot]
      robotVisible.value = !robotVisible.value
    }
    const close = () => {
      state.prevIdex = -2
      useLayout().closePlugin(true)
    }

    const fixPanel = (pluginName) => {
      pluginsState.fixedPanels = pluginsState.fixedPanels?.includes(pluginName)
        ? pluginsState.fixedPanels?.filter((item) => item !== pluginName)
        : [...pluginsState.fixedPanels, pluginName]
    }

    return {
      // designSmbConfig,
      leftBar,
      rightBar,
      centerBar,
      state,
      removeNode,
      canvasUrl,
      nodeSelected,
      selectFooterNode,
      footData,
      materialsPanel: materials.component,
      showMask,
      controller: {
        // 需要在canvas/render或内置组件里使用的方法
        getMaterial: useResource().getMaterial,
        addHistory: useHistory().addHistory,
        registerBlock: useResource().registerBlock,
        request: useHttp(),
        ast
      },
      siteCanvasStyle,
      canvasRef,
      activating,
      layoutState,
      clickMenu,
      openAIRobot,
      pluginRef,
      robotVisible,
      robotComponent,
      close,
      fixPanel,
      pluginsState,
      components,
      iconComponents,
      completed,
      doCompleted,
      pluginState
    }
  }
}
</script>
