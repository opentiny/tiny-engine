import { h, render } from 'vue'
import { Modal } from '@opentiny/vue'

const confirm = ({ title, status, message, exec, cancel, showFooter = true }) => {
  Modal.confirm({
    title,
    status,
    showFooter,
    message: () => {
      return (
        <div class="modal-content">
          <div class="wrap">
            {typeof message === 'string' ? message : <message />}
          </div>
        </div>
      )
    }
  }).then((res) => {
    if (res === 'confirm' && typeof exec === 'function') {
      exec()
    } else if (typeof cancel === 'function') {
      cancel()
    }
  })
}

const message = ({ title, status, message, exec, width = '400' }) => {
  Modal.alert({
    title,
    status,
    'confirm-btn-props': { text: '确定' },
    width: width,
    message() {
      return (
        <div div class="modal-content" >
          <div class="wrap">
            {typeof message === 'string' ? message : <message />}
          </div>
        </div >
      )
    }
  }).then(() => {
    if (typeof exec === 'function') {
      exec()
    }
  })
}

const topbox = (options) => {
  const props = { ...options, modelValue: true }
  let TopBox = h(Modal, props)
  const modalEl = document.createElement('div')

  const close = () => {
    TopBox.el.remove()
    TopBox = null
  }

  render(TopBox, modalEl)

  return {
    TopBox,
    close
  }
}

window.topbox = topbox
window.message = message

export default () => {
  return {
    confirm,
    message,
    topbox
  }
}
