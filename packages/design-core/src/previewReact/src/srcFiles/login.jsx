import React from 'react'

const Login = () => {
  const url = React.useRef('')
  return (
    <div style={{ position: 'fixed', zIndex: 999, top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#fff' }}>
      <iframe src={url.current} frameBorder="0" style={{ width: '100%', height: '100%' }}></iframe>
    </div>
  )
}

export default Login
