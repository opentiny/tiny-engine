import { useState, useEffect } from 'react'
import ReactLive from './component/reactLive'
const App = () => {
  const [views, setViews] = useState({})
  useEffect(() => {
    const handleMessage = (event) => {
      // 验证消息来源
      setViews(event.data?.message)
      if (event.data.key === 'files') {
        window.parent.postMessage('OK', '*')
      }
    }

    // 监听来自父窗口的消息
    window.addEventListener('message', handleMessage, false)

    // 清理事件监听器
    return () => {
      // window.removeEventListener('message', handleMessage)
    }
  }, [])
  return (
    <div>
      <ReactLive views={views} />
    </div>
  )
}

export default App
