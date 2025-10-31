import React from 'react'
import './DataBindingDemo.css'
import { Checkbox as AntdCheckbox, Input as AntdInput } from 'antd'

const DataBindingDemo = (props = {}) => {
  const [state, setState] = React.useState({
    username: '',
    email: '',
    isSubscribed: false
  })

  const utils = {}

  return (
    <>
      <div>
        <div style="padding: 20px;">
          <AntdInput
            value={state.username}
            onChange={(e) => setState((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="请输入用户名"
          ></AntdInput>
          <AntdInput
            value={state.email}
            onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
            type="email"
            placeholder="请输入邮箱"
          ></AntdInput>
          <AntdCheckbox
            checked={state.isSubscribed}
            onChange={(e) => setState((prev) => ({ ...prev, isSubscribed: e.target.checked }))}
          ></AntdCheckbox>
        </div>
      </div>
    </>
  )
}

export default DataBindingDemo
