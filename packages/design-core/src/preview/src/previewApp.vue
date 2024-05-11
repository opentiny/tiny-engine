<template>
  <div class="preview-box">
    <div class="preview">
      <div class="preview-title">
        温馨提示：预览页面默认打开的是根路由对应的页面，如果没有配置根路由页面，则需要补全URL后面的路由
      </div>
      <tiny-progress
        class="progress"
        :text-inside="true"
        :stroke-width="30"
        :percentage="percentage"
        :status="progressStatus"
      ></tiny-progress>
      <div>{{ statusText }}</div>
      <tiny-button v-if="isBtnShow" class="preview-btn" type="primary" @click="rebuildApp">重新构建</tiny-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { Progress, Button } from '@opentiny/vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { VITE_ORIGIN } from '@opentiny/tiny-engine-controller/js/environments'
import { EXTEND_CONFIG } from '@opentiny/tiny-engine-controller/js/app'
import { useApp } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyProgress: Progress,
    TinyButton: Button
  },
  setup() {
    const http = useHttp()
    const paramsMap = new URLSearchParams(location.search)
    const appId = paramsMap.get('appid')
    // 轮询默认事件
    const INTERVAL_PROGRESS = 3000
    const percentage = ref(0)
    const progressStatus = ref('exception')
    const isBtnShow = ref(false)
    // 应用预览任务说明
    const taskStatus = {
      RUNNING: 1,
      STOPPED: 2,
      FINISHED: 3
    }

    const deployTips = {
      1: '正在构建中...',
      2: '构建失败，请重新构建',
      3: '构建完成'
    }
    const statusText = ref(deployTips[1])

    const addPercent = () => {
      if (percentage.value >= 90) {
        return
      } else {
        if (percentage.value >= 50 && percentage.value < 75) {
          progressStatus.value = 'warning'
        } else if (percentage.value >= 75) {
          progressStatus.value = 'success'
        }
        percentage.value += 2
      }
    }

    const cyclesFetchStatus = (taskId) => {
      if (!taskId) {
        return
      }
      addPercent()

      http.get(`/app-center/api/tasks/status/${taskId}`).then((data) => {
        statusText.value = deployTips[data.taskStatus]
        if (data.taskStatus === taskStatus.RUNNING) {
          setTimeout(() => {
            cyclesFetchStatus(taskId)
          }, INTERVAL_PROGRESS)
        } else if (data.taskStatus === taskStatus.FINISHED) {
          progressStatus.value = 'success'
          percentage.value = 100

          let openUrl = `${VITE_ORIGIN}/app-center/entry/${appId}/`

          const { appInfoState, updateApp } = useApp()

          updateApp(appId)
            .then(() => {
              const extendConfig = appInfoState.selectedApp?.extend_config || {}

              if (extendConfig?.app_type === EXTEND_CONFIG.TYPE.CONSOLE) {
                openUrl = `${VITE_ORIGIN}/app-service/${extendConfig?.app_type ?? extendConfig?.type}${
                  extendConfig.business.router
                }?appId=${appId}&region=cn-north-7&previewType=app&env=alpha&tenant=${paramsMap.get('tenant')}`
              }
            })
            .finally(() => {
              window.location = openUrl
            })
        } else {
          progressStatus.value = 'exception'
          percentage.value = 0
          isBtnShow.value = true
        }
      })
    }

    const previewApp = () => {
      http
        .get(`/app-center/api/apps/preview/${appId}`)
        .then((data) => {
          if (data.taskId || data.id) {
            setTimeout(() => {
              cyclesFetchStatus(data.taskId || data.id)
            }, INTERVAL_PROGRESS)
          }
        })
        .catch((err) => {
          progressStatus.value = 'exception'
          percentage.value = 0
          isBtnShow.value = true
          statusText.value = err?.message || deployTips[2]
        })
    }

    const rebuildApp = () => {
      isBtnShow.value = false
      progressStatus.value = 'exception'
      percentage.value = 0
      previewApp()
    }

    onMounted(previewApp)

    return {
      statusText,
      percentage,
      progressStatus,
      isBtnShow,
      rebuildApp
    }
  }
}
</script>

<style lang="less" scoped>
.preview-box {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;

  .preview {
    width: 50vw;
    text-align: center;

    .preview-title {
      margin-bottom: 20px;
    }

    .progress {
      margin-bottom: 30px;
    }

    .preview-btn {
      margin-top: 15px;
    }
  }
}
</style>
