import { ref } from 'vue'

export default function useSpeechRecognition() {
  // eslint-disable-next-line no-undef
  const recognition = webkitSpeechRecognition ? new webkitSpeechRecognition() : null
  const recognizedText = ref('')

  if (recognition) {
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const recognized = event.results[event.results.length - 1][0].transcript
      recognizedText.value = recognized
    }
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
