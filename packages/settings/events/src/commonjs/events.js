/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

export const commonEvents = {
  onClick: {
    label: {
      zh_CN: '鼠标单击时触发'
    },
    description: {
      zh_CN: '鼠标单击时触发的回调函数'
    },
    type: 'event',
    functionInfo: {
      params: [],
      returns: {}
    },
    defaultValue: ''
  },
  onChange: {
    label: {
      zh_CN: '值被改变时触发'
    },
    description: {
      zh_CN: '当用户更改 <input>、<select> 和 <textarea> 元素的值时，被触发的回调函数，'
    },
    type: 'event',
    functionInfo: {
      params: [],
      returns: {}
    },
    defaultValue: ''
  },
  onFocus: {
    label: {
      zh_CN: '元素获得焦点'
    },
    description: {
      zh_CN: '元素获得焦点时触发的回调函数'
    },
    type: 'event',
    functionInfo: {
      params: [],
      returns: {}
    },
    defaultValue: ''
  },
  onMousemove: {
    label: {
      zh_CN: '鼠标移动时触发'
    },
    description: {
      zh_CN: '鼠标移动时触发的回调函数'
    },
    type: 'event',
    functionInfo: {
      params: [],
      returns: {}
    },
    defaultValue: ''
  }
}

const allEvents = [
  'onabort',
  'onafterprint',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'onappinstalled',
  'onauxclick',
  'onbeforeinstallprompt',
  'onbeforeprint',
  'onbeforeunload',
  'onbeforexrselect',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextlost',
  'oncontextmenu',
  'oncontextrestored',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'onformdata',
  'ongotpointercapture',
  'onhashchange',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onlanguagechange',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onlostpointercapture',
  'onmessage',
  'onmessageerror',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onoffline',
  'ononline',
  'onpagehide',
  'onpageshow',
  'onpause',
  'onplay',
  'onplaying',
  'onpointercancel',
  'onpointerdown',
  'onpointerenter',
  'onpointerleave',
  'onpointermove',
  'onpointerout',
  'onpointerover',
  'onpointerrawupdate',
  'onpointerup',
  'onpopstate',
  'onprogress',
  'onratechange',
  'onrejectionhandled',
  'onreset',
  'onresize',
  'onscroll',
  'onsearch',
  'onsecuritypolicyviolation',
  'onseeked',
  'onseeking',
  'onselect',
  'onselectionchange',
  'onselectstart',
  'onslotchange',
  'onstalled',
  'onstorage',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'ontransitioncancel',
  'ontransitionend',
  'ontransitionrun',
  'ontransitionstart',
  'onunhandledrejection',
  'onunload',
  'onvolumechange',
  'onwaiting',
  'onwebkitanimationend',
  'onwebkitanimationiteration',
  'onwebkitanimationstart',
  'onwebkittransitionend',
  'onwheel'
]

export const checkEvent = (event) => {
  const checkEventList = allEvents.map((e) => {
    let three = e[2].toUpperCase()
    return `${e.substring(0, 2)}${three}${e.substring(3)}`
  })
  if (!checkEventList.includes(event)) {
    return false
  }
  return true
}
