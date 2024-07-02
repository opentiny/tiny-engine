export const baseProperties = [
  {
    property: 'id',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: '元素id值'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  },
  {
    property: 'className',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: '样式类'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  },
  {
    property: 'ref',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: 'ref引用类'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  }
]
