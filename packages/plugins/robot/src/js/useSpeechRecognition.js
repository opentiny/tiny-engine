import { ref } from 'vue'
import { Notify } from '@opentiny/vue'

export default function useSpeechRecognition() {
  const recognition = window.webkitSpeechRecognition ? new window.webkitSpeechRecognition() : null
  const recognizedText = ref('')

  if (recognition) {
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const recognized = event.results[event.results.length - 1][0].transcript
      recognizedText.value = recognized
    }
    recognition.onerror = (event) => {
      Notify({
        type: 'error',
        message: '语音识别错误：' + event.error,
        position: 'top-right',
        duration: 5000
      })
    }
    recognition.onnomatch = () => {
      Notify({
        type: 'warning',
        message: '没有找到匹配的语音',
        position: 'top-right',
        duration: 5000
      })
    }
  } else {
    Notify({
      type: 'warning',
      message: '此浏览器不支持语音识别,请更换浏览器后再尝试。',
      position: 'top-right',
      duration: 5000
    })
  }

  const startRecognition = () => {
    if (recognition) {
      recognition.start()
    }
  }

  const stopRecognition = () => {
    if (recognition) {
      recognition.stop()
    }
  }

  return {
    startRecognition,
    stopRecognition,
    recognizedText
  }
}
