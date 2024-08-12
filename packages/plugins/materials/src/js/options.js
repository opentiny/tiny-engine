export const basePropertyOptions = {
  properties: [
    {
      group: 'others',
      label: {
        zh_CN: '其他'
      },
      content: [
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
            component: 'InputConfigurator',
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
            component: 'InputConfigurator',
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
            component: 'InputConfigurator',
            props: {}
          }
        }
      ]
    }
  ],
  insertPosition: 'start' // 'start' | 'end'
}
