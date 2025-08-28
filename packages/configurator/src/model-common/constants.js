export const typeComponentsMap = {
  String: { component: 'TinyInput' },
  Boolean: {
    component: 'TinySelect',
    props: {
      options: [
        {
          label: '是',
          value: true,
        },
        {
          label: '否',
          value: false,
        },
      ]
    },
  },
  Date: { component: 'TinyDatePicker', props: { format: 'yyyy-MM-dd', valueFormat: 'yyyy-MM-dd' }},
  Number: { component: 'TinyNumeric' },
  Enum: {
    component: 'TinySelect'
  },
};