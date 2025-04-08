import { h, render } from 'vue'
import { Modal } from '@opentiny/vue'

export interface ModalOptions {
  title: string
  status?: string
  message: string | ((...args: any[]) => any)
  exec?: (...args: any[]) => any
  cancel?: (...args: any[]) => any
  showFooter?: boolean
}

export type ConfirmOptions = ModalOptions

const confirm = ({ title, status, message, exec, cancel, showFooter = true }: ConfirmOptions) => {
  Modal.confirm({
    title,
    status,
    showFooter,
    message: () => {
      return (
        <div class="modal-content">
          <div class="wrap">{typeof message === 'string' ? message : <message />}</div>
        </div>
      )
    }
  }).then((res: string) => {
    if (res === 'confirm' && typeof exec === 'function') {
      exec()
    } else if (typeof cancel === 'function') {
      cancel()
    }
  })
}

export type MessageOptions = Pick<ModalOptions, 'title' | 'status' | 'message' | 'exec'> & { width?: string }

const message = ({ title, status, message, exec, width = '400' }: MessageOptions) => {
  Modal.alert({
    title,
    status,
    'confirm-btn-props': { text: '确定' },
    width: width,
    message() {
      return (
        <div div class="modal-content">
          <div class="wrap">{typeof message === 'string' ? message : <message />}</div>
        </div>
      )
    }
  }).then(() => {
    if (typeof exec === 'function') {
      exec()
    }
  })
}

const topbox = (options: ModalOptions) => {
  const props = { ...options, modelValue: true }
  let TopBox = h(Modal, props)
  const modalEl = document.createElement('div')

  const close = () => {
    TopBox.el?.remove()
    TopBox = null
  }

  render(TopBox, modalEl)

  return {
    TopBox,
    close
  }
}

declare global {
  interface Window {
    topbox?: (options: ModalOptions) => { TopBox: any; close: () => void }
    message?: (options: MessageOptions) => void
  }
}

window.topbox = topbox
window.message = message

export default {
  confirm,
  message,
  topbox
}
