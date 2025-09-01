import React from 'react'
import './LifecycleTestPage.css'
import { Button as TinyButton } from 'antd'

class LifecycleTestPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    console.log('Component mounted')
  }

  componentWillUnmount() {
    console.log('Component unmounted')
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('Component updated')
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error)
  }

  handleClick = () => {
    console.log('Button clicked')
  }

  render() {
    const { state } = this
    const utils = {}

    return (
      <>
        <div>
          <div style="padding: 20px;">
            <TinyButton onClick={this.handleClick}>点击按钮</TinyButton>
          </div>
        </div>
      </>
    )
  }
}

export default LifecycleTestPage
