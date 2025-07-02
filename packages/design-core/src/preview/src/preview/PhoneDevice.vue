<template>
  <div
    class="device-container"
    :style="{
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'top center'
    }"
  >
    <div class="device-frame" :class="[deviceType, { landscape: isLandscape }]" :style="deviceStyle">
      <div class="device-header"></div>

      <div class="device-screen">
        <div class="device-status-bar" :style="{ backgroundColor: statusBarColor }">
          <div class="status-time">{{ currentTime }}</div>
          <div class="status-icons">
            <span class="status-icon">📶</span>
            <span class="status-icon">🔋</span>
          </div>
        </div>

        <!-- 内容插槽 -->
        <div class="device-content">
          <slot></slot>
        </div>

        <!-- 屏幕边缘光效 -->
        <div class="device-screen-edge-light" v-if="deviceType === 'huawei-mate70-pro'"></div>
      </div>

      <div class="device-footer"></div>

      <!-- 边缘高光 -->
      <div class="device-edge-highlight" v-if="deviceType === 'huawei-mate70-pro'"></div>

      <div v-if="deviceType === 'huawei-mate70-pro' && !isLandscape">
        <div class="huawei-camera-module" v-for="i in 3" :key="i" :style="{ left: 34 + i * 8 + '%' }">
          <div class="camera-ring">
            <div class="camera-inner">
              <div class="camera-lens camera-lens-1"></div>
              <div class="camera-lens camera-lens-2"></div>
              <div class="camera-lens camera-lens-3"></div>
              <div class="camera-lens camera-lens-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  deviceType: {
    type: String,
    default: 'huawei-mate70-pro'
  },
  isLandscape: {
    type: Boolean,
    default: false
  },
  zoomLevel: {
    type: Number,
    default: 0.8
  },
  statusBarColor: {
    type: String,
    default: 'transparent'
  }
})

// 设备配置
const devices = [
  {
    id: 'huawei-mate70-pro',
    name: '华为Mate70 Pro',
    width: '390px',
    height: '844px',
    hasNotch: false,
    hasHomeButton: false,
    hasPunchHole: true,
    borderRadius: '50px',
    curvedScreen: true,
    specialFeatures: ['quad-camera']
  },
  {
    id: 'iphone',
    name: 'iPhone 13',
    width: '375px',
    height: '812px',
    hasNotch: true,
    hasHomeButton: false,
    borderRadius: '44px'
  },
  {
    id: 'android',
    name: 'Android',
    width: '360px',
    height: '740px',
    hasNotch: false,
    hasHomeButton: false,
    borderRadius: '30px'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: '320px',
    height: '568px',
    hasNotch: false,
    hasHomeButton: true,
    borderRadius: '40px'
  },
  {
    id: 'ipad',
    name: 'iPad',
    width: '768px',
    height: '1024px',
    hasNotch: false,
    hasHomeButton: true,
    borderRadius: '20px'
  }
]

// 获取当前时间格式化
function getCurrentTime() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

const currentTime = ref(getCurrentTime())

// 定时更新时间
let timeInterval
onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = getCurrentTime()
  }, 60000) // 每分钟更新一次
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// 获取当前设备配置
const deviceConfig = computed(() => {
  return devices.find((device) => device.id === props.deviceType) || devices[0]
})

// 设备样式
const deviceStyle = computed(() => {
  if (!deviceConfig.value) return {}

  return {
    width: props.isLandscape ? deviceConfig.value.height : deviceConfig.value.width,
    height: props.isLandscape ? deviceConfig.value.width : deviceConfig.value.height,
    borderRadius: deviceConfig.value.borderRadius
  }
})
</script>

<style scoped>
.device-container {
  transition: transform 0.3s ease;
}

.device-frame {
  position: relative;
  background-color: #111;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15), 0 10px 15px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 12px solid #111;
}

/* iPhone样式 */
.device-frame.iphone {
  border-radius: 44px;
}

/* Android样式 */
.device-frame.android {
  border-radius: 30px;
  background-color: #333;
}

/* iPhone SE样式 */
.device-frame.iphone-se {
  border-radius: 40px;
}

/* iPad样式 */
.device-frame.ipad {
  border-radius: 20px;
}

/* 华为Mate70 Pro样式 */
.device-frame.huawei-mate70-pro {
  border-radius: 50px;
  background: black;
  border: 6px solid black;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2), 0 8px 12px rgba(0, 0, 0, 0.15), inset 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

/* 黑色边框的高光效果 */
.device-frame.huawei-mate70-pro::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 30%;
  right: 30%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  border-radius: 50%;
  filter: blur(1px);
}

/* 曲面屏幕效果 */
.device-frame.huawei-mate70-pro .device-screen {
  border-radius: 46px;
  overflow: hidden;
  position: relative;
  margin: -2px;
}

/* 屏幕边缘光效 */
.device-frame.huawei-mate70-pro .device-screen-edge-light {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 46px;
  background: transparent;
  pointer-events: none;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.03), inset 0 0 3px rgba(255, 255, 255, 0.05);
  z-index: 10;
}

/* 模拟曲面屏幕的边缘高光 */
.device-frame.huawei-mate70-pro .device-edge-highlight {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 5%,
    transparent 95%,
    rgba(255, 255, 255, 0.05) 100%
  );
  z-index: 12;
  border-radius: 42px;
}

.device-frame.huawei-mate70-pro .device-header {
  height: 8px;
  background-color: transparent;
}

.device-frame.huawei-mate70-pro .device-footer {
  height: 8px;
  background-color: transparent;
}

.device-frame.huawei-mate70-pro .device-navigation-bar {
  display: flex;
  justify-content: center;
  align-items: center;
}

.device-frame.huawei-mate70-pro .device-navigation-bar .nav-home {
  width: 120px;
  height: 5px;
  border: none;
  background-color: #555;
  border-radius: 3px;
}

.device-frame.huawei-mate70-pro .device-navigation-bar .nav-back,
.device-frame.huawei-mate70-pro .device-navigation-bar .nav-recent {
  display: none;
}

/* 横屏样式调整 */
.device-frame.landscape {
  flex-direction: row;
}

.device-header {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.device-punch-hole {
  width: 5px;
  height: 5px;
  background-color: #000;
  border-radius: 50%;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

/* 华为Mate70 Pro特有的打孔屏 */
.device-frame.huawei-mate70-pro .device-punch-hole {
  width: 4px;
  height: 4px;
  background-color: #000;
  border-radius: 50%;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.device-screen {
  flex: 1;
  background-color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.device-status-bar {
  height: 40px;
  /* background-color: transparent; */
  /* background-color: #f07373; */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px;
  font-size: 20px;
  color: #fff;
  z-index: 15;
}

.status-time {
  font-size: 20px;
  color: black;
  padding: 2px 0px 0px 8px;
}

.status-icons {
  display: flex;
  gap: 5px;
}

.device-content {
  width: 100%;
  height: 100%;
  /* flex: 1;
  display: flex;
  overflow: hidden;
  position: relative; */
}

.device-footer {
  height: 40px;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 华为Mate70 Pro摄像头模块 */
.huawei-camera-module {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  z-index: 30;
}

.camera-ring {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #333, #111);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(80, 80, 80, 0.5);
}

.camera-inner {
  background: #0a0a0a;
  border-radius: 50%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 5px;
  padding: 5px;
  position: relative;
}

.camera-lens {
  background: linear-gradient(135deg, #111, #000);
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 0 4px rgba(100, 100, 255, 0.3), 0 0 2px rgba(0, 0, 0, 0.5);
  border: 1px solid #222;
}

.camera-lens::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 65%;
  height: 65%;
  background: radial-gradient(circle, #444 0%, #222 40%, #000 100%);
  border-radius: 50%;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.8);
}

.camera-lens::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 20%;
  width: 20%;
  height: 20%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(1px);
}

/* 增加镜头特效 */
.camera-lens-1::before {
  background: radial-gradient(circle, #555 0%, #222 40%, #000 100%);
}

.camera-lens-2::before {
  background: radial-gradient(circle, #353535 0%, #151515 40%, #000 100%);
}

.camera-lens-3::before {
  background: radial-gradient(circle, #444 0%, #111 50%, #000 100%);
}

.camera-lens-4::before {
  background: radial-gradient(circle, #333 0%, #111 40%, #000 100%);
}
</style>
