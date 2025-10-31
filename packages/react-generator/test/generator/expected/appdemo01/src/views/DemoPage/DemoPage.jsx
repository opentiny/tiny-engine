import React from 'react'
import './DemoPage.css'
import { Button, Input, Typography } from 'antd'

class DemoPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      inputValue: '',
      count: 0
    }
  }

  componentDidMount() {
    console.log('Component mounted')
  }

  handleClick = () => {
    this.setState({ count: this.state.count + 1 })
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value })
  }

  render() {
    const { state } = this
    const utils = {}

    return (
      <>
        <div>
          <div className="page-container">
            <Typography variant="h1" style={{ marginBottom: '20px' }}>
              React Demo Page
            </Typography>
            <Input
              placeholder="请输入内容"
              value={state.inputValue}
              onChange={this.handleInputChange}
              style={{ marginBottom: '10px' }}
            ></Input>
            <Button type="primary" onClick={this.handleClick} style={{ marginBottom: '10px' }}>
              {'点击次数: ' + state.count}
            </Button>
            <Typography variant="body1">{'输入内容: ' + state.inputValue}</Typography>
          </div>
        </div>
      </>
    )
  }
}

export default DemoPage
