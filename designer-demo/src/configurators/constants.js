export const typeComponentsMap = {
  STRING: { component: 'TinyInput' },
  TEXT: { component: 'TinyInput' },
  BOOLEAN: {
    component: 'TinySelect',
    props: {
      options: [
        {
          label: 'true',
          value: true,
        },
        {
          label: 'false',
          value: false,
        },
      ],
    },
  },
  DATETIME: { component: 'TinyDatePicker'},
  INTERGER: { component: 'TinyInput', props: { type: 'number' } },
  LONG: { component: 'TinyInput', props: { type: 'number' } },
  DECIMAL: { component: 'TinyInput', props: { type: 'number' } },
  DECIMAL_WITH_PRECISION: { component: 'TinyInput', props: { type: 'number' } },
  DOUBLE: { component: 'TinyInput', props: { type: 'number' } },
  BIGINTEGER: { component: 'TinyInput', props: { type: 'number' } },
  ENUM: {
    component: 'TinySelect',
    props: { valueField: 'alias', textField: 'name' },
  },
};

export const modelType = {
  FORM: 'ModelForm',
  TABLE: 'ModelTable',
  PAGE: 'ModelPage',
};
