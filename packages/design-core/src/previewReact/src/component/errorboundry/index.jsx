import React from 'react'

// 自定义错误边界组件
export class ErrorBoundary extends React.Component {
  componentDidCatch() {
    // 当发生错误时，打印错误信息
    // console.error('Caught an error:', error)
  }

  render() {
    return this.props.children
  }
}
