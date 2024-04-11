/* eslint-disable react-refresh/only-export-components */
import { z } from 'zod'
import { AIForm, AnyZodType, createField } from '../ai-form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export const getEditComponentForm = (component: string): AIForm => {
  if (!fieldsMap[component]) {
    return dummyForm
  }
  return {
    name: `edit_props`,
    description: `编辑 ${component} 组件属性`,
    fields: [...basicFields, ...fieldsMap[component]],
    ui: uiMap[component]
  }
}

const BasicSchema = {
  style: z.string().describe('组件 inline CSS 样式，输入合法的 CSS 字符串'),
  __state__: z.any().describe('定义 state 管理状态，类型对应 Typescript 中的 Record'),
  __methods__: z.any().describe('定义 methods 方法，确保新增的事件的监听方法被定义，类型对应 Typescript 中的 Record'),
  __loop__: z
    .object({
      type: z.string(),
      value: z.string()
    })
    .describe('组件循环的对象'),
  __loopArgs__: z.array(z.string()).describe('固定为 `["item", "index"]`')
}

const basicFields = [
  createField({
    name: 'style',
    schema: BasicSchema.style,
    required: true
  }),
  createField({
    name: '__state__',
    schema: BasicSchema.__state__,
    required: true
  }),
  createField({
    name: '__methods__',
    schema: BasicSchema.__methods__,
    required: true
  }),
  createField({
    name: '__loop__',
    schema: BasicSchema.__loop__,
    required: false
  }),
  createField({
    name: '__loopArgs__',
    schema: BasicSchema.__loopArgs__,
    required: false
  })
]

function toValueSchema<T>(schema: T) {
  return z.object({
    ...BasicSchema,
    ...schema
  })
}

type ControlledProps<T> = { value: T; onChange: (newValue: T) => void }

function toFields<T extends Record<string, AnyZodType>>(schema: T) {
  return Object.keys(schema).map((key) =>
    createField({
      name: key,
      schema: schema[key],
      required: true
    })
  )
}

const FormItem: React.FC<{ children?: React.ReactNode; label: string }> = ({ children, label }) => {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

const StyleInput: React.FC<ControlledProps<string>> = ({ value, onChange }) => {
  return (
    <Textarea
      value={value}
      onChange={(evt) => {
        onChange(evt.currentTarget.value)
      }}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JsonInput: React.FC<ControlledProps<any>> = ({ value, onChange }) => {
  return (
    <Textarea
      value={typeof value === 'string' || !value ? value : JSON.stringify(value, null, 2)}
      onChange={(evt) => {
        const newValue = evt.currentTarget.value
        try {
          onChange(JSON.parse(newValue))
        } catch {
          onChange(newValue)
        }
      }}
    />
  )
}

const StringInput: React.FC<ControlledProps<string>> = ({ value, onChange }) => {
  return (
    <Input
      value={value}
      onChange={(evt) => {
        onChange(evt.currentTarget.value)
      }}
    />
  )
}

const NumberInput: React.FC<ControlledProps<number>> = ({ value, onChange }) => {
  return (
    <Input
      type="number"
      value={value}
      onChange={(evt) => {
        const newValue = parseInt(evt.currentTarget.value, 10)
        if (Number.isNaN(newValue)) {
          return
        }
        onChange(newValue)
      }}
    />
  )
}

const BooleanInput: React.FC<ControlledProps<boolean>> = ({ value, onChange }) => {
  return <Switch checked={value} onCheckedChange={onChange} />
}

// TinyPager

const TinyPagerSchema = {
  currentPage: z.number().int().describe('当前页数'),
  pageSize: z.number().int().describe('每页显示条目个数'),
  total: z.number().int().describe('总条数')
}

const TinyPagerFields = toFields(TinyPagerSchema)

const TinyPagerValue = toValueSchema(TinyPagerSchema)

const TinyPagerUI: React.FC<ControlledProps<z.infer<typeof TinyPagerValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="当前页">
          <NumberInput
            value={value.currentPage}
            onChange={(newValue) => {
              onChange({
                ...value,
                currentPage: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="总条数">
          <NumberInput
            value={value.total}
            onChange={(newValue) => {
              onChange({
                ...value,
                total: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="每页条数">
          <NumberInput
            value={value.pageSize}
            onChange={(newValue) => {
              onChange({
                ...value,
                pageSize: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// TinySelect

const TinySelectSchema = {
  placeholder: z.string().describe('输入框占位文本'),
  clearable: z.boolean().describe('是否显示清除按钮'),
  searchable: z.boolean().describe('下拉面板是否可搜索'),
  disabled: z.boolean().describe('是否禁用'),
  multiple: z.boolean().describe('是否允许输入框输入或选择多个项'),
  options: z
    .array(
      z.object({
        value: z.string().describe('下拉项数值'),
        label: z.string().describe('下拉项展示文本')
      })
    )
    .describe('配置 Select 下拉数据项')
}

const TinySelectFields = toFields(TinySelectSchema)

const TinySelectValue = toValueSchema(TinySelectSchema)

const TinySelectUI: React.FC<ControlledProps<z.infer<typeof TinySelectValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="占位文本">
          <StringInput
            value={value.placeholder}
            onChange={(newValue) => {
              onChange({
                ...value,
                placeholder: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="清除按钮">
          <BooleanInput
            value={value.clearable}
            onChange={(newValue) => {
              onChange({
                ...value,
                clearable: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="下拉面板可搜索">
          <BooleanInput
            value={value.searchable}
            onChange={(newValue) => {
              onChange({
                ...value,
                searchable: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="禁用">
          <BooleanInput
            value={value.disabled}
            onChange={(newValue) => {
              onChange({
                ...value,
                disabled: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="多选">
          <BooleanInput
            value={value.multiple}
            onChange={(newValue) => {
              onChange({
                ...value,
                multiple: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="下拉数据">
          <JsonInput
            value={value.options}
            onChange={(newValue) => {
              onChange({
                ...value,
                options: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// Paragraph

const ParagraphSchema = {
  children: z.union([
    z.string().describe('文案内容'),
    z
      .object({
        type: z.string().describe('值固定为 JSExpression'),
        value: z.string()
      })
      .describe('动态文案内容')
  ])
}

const ParagraphFields = toFields(ParagraphSchema)

const ParagraphValue = toValueSchema(ParagraphSchema)

const ParagraphUI: React.FC<ControlledProps<z.infer<typeof ParagraphValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="文本内容">
          <StringInput
            value={typeof value.children === 'string' || !value.children ? value.children : value.children.value}
            onChange={(newValue) => {
              onChange({
                ...value,
                children: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// Div

const DivSchema = {
  // children: ParagraphSchema.children
}

const DivFields = toFields(DivSchema)

const DivValue = toValueSchema(DivSchema)

const DivUI: React.FC<ControlledProps<z.infer<typeof DivValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// TinyInput

const TinyInputSchema = {
  placeholder: z.string().describe('输入框占位文本'),
  modelValue: z.object({
    type: z.string().describe('通过组件 modelValue props 将全局状态绑定至组件，格式为 this.state.$key'),
    value: z.string(),
    model: z.boolean()
  }),
  onKeydown: z
    .object({
      type: z.string(),
      value: z.string(),
      params: z.array(z.string())
    })
    .describe('处理 keydown 事件')
}

const TinyInputFields = toFields(TinyInputSchema)

const TinyInputValue = toValueSchema(TinyInputSchema)

const TinyInputUI: React.FC<ControlledProps<z.infer<typeof TinyInputValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="占位文本">
          <StringInput
            value={value.placeholder}
            onChange={(newValue) => {
              onChange({
                ...value,
                placeholder: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// TinyButton

const TinyButtonSchema = {
  text: z.string().describe('按钮文案'),
  onClick: z
    .object({
      type: z.string(),
      value: z.string(),
      params: z.array(z.string())
    })
    .describe('处理 click 事件')
}

const TinyButtonFields = toFields(TinyButtonSchema)

const TinyButtonValue = toValueSchema(TinyButtonSchema)

const TinyButtonUI: React.FC<ControlledProps<z.infer<typeof TinyButtonValue>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

// H1

const H1Schema = {
  children: z.string().describe('文本内容')
}

const H1Fields = toFields(H1Schema)

const H1Value = toValueSchema(H1Schema)

const H1UI: React.FC<ControlledProps<z.infer<typeof H1Value>>> = ({ value, onChange }) => {
  return (
    <Card>
      <CardContent className="pt-2">
        <FormItem label="样式">
          <StyleInput
            value={value.style}
            onChange={(newValue) => {
              onChange({
                ...value,
                style: newValue
              })
            }}
          />
        </FormItem>
        <FormItem label="文本内容">
          <StringInput
            value={value.children}
            onChange={(newValue) => {
              onChange({
                ...value,
                children: newValue
              })
            }}
          />
        </FormItem>
      </CardContent>
    </Card>
  )
}

const fieldsMap: Record<string, AIForm['fields']> = {
  TinyPager: TinyPagerFields,
  TinySelect: TinySelectFields,
  p: ParagraphFields,
  div: DivFields,
  TinyInput: TinyInputFields,
  TinyButton: TinyButtonFields,
  h1: H1Fields
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uiMap: Record<string, React.FC<any>> = {
  TinyPager: TinyPagerUI,
  TinySelect: TinySelectUI,
  p: ParagraphUI,
  div: DivUI,
  TinyInput: TinyInputUI,
  TinyButton: TinyButtonUI,
  h1: H1UI
}

export const dummyForm: AIForm = {
  name: 'dummy',
  description: '',
  fields: []
}

// utils

interface PageSchema {
  css?: string
  children?: Array<ComponentSchema> | string
}

interface ComponentSchema {
  componentName?: string
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: any
  children?: Array<ComponentSchema> | string
  loop?: any
  loopArgs?: any
}

export function traverseSchema(
  schema: PageSchema | ComponentSchema,
  id: string,
  currentLoopScope: string | null
): [ComponentSchema | null, string | null] {
  if (typeof schema.children === 'string' || 'value' in (schema.children || {})) {
    return [null, null]
  }

  let loopScope = 'loop' in schema ? schema.loop.value : currentLoopScope

  for (const v of schema.children || []) {
    if (v.id === id) {
      return [v, loopScope]
    }
    const nest = traverseSchema(v, id, loopScope)
    if (nest[0]) {
      return nest
    }
  }

  return [null, null]
}

export function mergeProps(schema: ComponentSchema | null) {
  if (!schema) {
    return schema
  }
  if (schema.children && !schema.props) {
    schema.props = {}
  }
  Object.assign(schema.props, { children: schema.children })
  return schema
}

export function revertProps(schema: ComponentSchema | null, pageSchema: any, loopScope: string | null) {
  if (!schema) {
    return schema
  }
  if (schema.props?.children) {
    schema.children = schema.props.children
    delete schema.props.children
    if (Object.keys(schema.props).length === 0) {
      delete schema.props
    }
  }

  if (schema.props?.__state__) {
    pageSchema.state = pageSchema.state || {}
    Object.assign(pageSchema.state, schema.props.__state__)
    delete schema.props.__state__
  }
  if (schema.props?.__methods__) {
    pageSchema.methods = pageSchema.methods || {}
    Object.assign(pageSchema.methods, schema.props.__methods__)
    delete schema.props.__methods__
  }

  // common sense check
  const ignoreLoop = loopScope === schema.props?.__loop__?.value
  if (schema.props?.__loop__) {
    if (!ignoreLoop) {
      schema.loop = schema.props.__loop__
    }
    delete schema.props.__loop__
  }
  if (schema.props?.__loopArgs__) {
    if (!ignoreLoop) {
      schema.loopArgs = schema.props.__loopArgs__
    }
    delete schema.props.__loopArgs__
  }

  return schema
}
