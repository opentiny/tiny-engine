const DEFAULT_COMPONENT_MAP = {
  'tiny-form': 'TinyForm',
  'tiny-form-item': 'TinyFormItem',
  'tiny-button': 'TinyButton',
  'tiny-button-group': 'TinyButtonGroup',
  'tiny-switch': 'TinySwitch',
  'tiny-select': 'TinySelect',
  'tiny-search': 'TinySearch',
  'tiny-input': 'TinyInput',
  'tiny-grid': 'TinyGrid',
  'tiny-grid-item': 'TinyGridItem',
  'tiny-col': 'TinyCol',
  'tiny-row': 'TinyRow',
  'tiny-time-line': 'TinyTimeLine',
  'tiny-card': 'TinyCard'
}

const CORE_SCHEMA_COMPONENT_NAMES = [
  'Page',
  'Block',
  'Text',
  'Icon',
  'Template',
  'Collection',
  'Slot',
  'slot',
  'RouterView',
  'RouterLink',
  'CanvasPlaceholder'
]

const HTML_TAG_ALIASES = new Set([
  'a',
  'article',
  'aside',
  'button',
  'div',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'img',
  'input',
  'label',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'section',
  'slot',
  'span',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
  'video'
])

function unique(values = []) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ]
}

function visitMaterialInput(input, collector) {
  if (!input) return

  if (Array.isArray(input)) {
    input.forEach((item) => visitMaterialInput(item, collector))
    return
  }

  if (typeof input === 'string') {
    collector.push(input)
    return
  }

  if (typeof input !== 'object') return

  if (typeof input.component === 'string') {
    collector.push(input.component)
  }

  if (Array.isArray(input.components)) {
    input.components.forEach((item) => visitMaterialInput(item, collector))
  }

  if (Array.isArray(input.materials?.components)) {
    input.materials.components.forEach((item) => visitMaterialInput(item, collector))
  }

  if (Array.isArray(input.data?.materials?.components)) {
    input.data.materials.components.forEach((item) => visitMaterialInput(item, collector))
  }
}

function toKebabCase(componentName = '') {
  return String(componentName)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

function createComponentAliasMap(componentNames = []) {
  return componentNames.reduce((map, componentName) => {
    const alias = toKebabCase(componentName)
    if (!alias || HTML_TAG_ALIASES.has(alias)) return map

    map[alias] = componentName
    return map
  }, {})
}

export const builtinSchemaComponentNames = CORE_SCHEMA_COMPONENT_NAMES
export const builtinSchemaComponents = new Set(builtinSchemaComponentNames)

export function getMaterialComponentNames(materials) {
  const componentNames = []
  visitMaterialInput(materials, componentNames)
  return unique(componentNames)
}

export function getSupportedSchemaComponentNames(options = {}) {
  return unique([
    ...builtinSchemaComponentNames,
    ...getMaterialComponentNames(options.materials),
    ...unique(options.supportedComponents || [])
  ])
}

export function getSupportedSchemaComponents(options = {}) {
  return new Set(getSupportedSchemaComponentNames(options))
}

export function createDefaultComponentMap(options = {}) {
  return {
    ...DEFAULT_COMPONENT_MAP,
    ...createComponentAliasMap(getSupportedSchemaComponentNames(options))
  }
}
