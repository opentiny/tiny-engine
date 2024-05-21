<template>
  <div class="className-container">
    <h6 class="title">
      <span>全局样式</span>
      <link-button :href="docsUrl" class="help-link"></link-button>
    </h6>
    <div class="selector-container">
      <meta-code-editor
        :modelValue="state.cssContent"
        title="Css 编辑"
        language="css"
        v-slot="scope"
        single
        @save="save"
      >
        <div class="edit-global-css" title="编辑全局样式" @click="scope.open">
          <svg-icon name="edit"></svg-icon>
        </div>
      </meta-code-editor>
      <div class="selector-right-container">
        <div class="selector-right-container-wrap">
          <div
            :class="['className-selector-container', { 'has-error': classNameState.selectorHasError }]"
            @click="handleFocusInput"
          >
            <div v-if="classNameState.curSelector || classNameState.curSelectorIsEditing" class="current-selector">
              <div class="current-selector-label">
                <span
                  ref="selectorTextRef"
                  :contenteditable="classNameState.curSelectorIsEditing"
                  :class="['selector-label-text', { 'text-editing': classNameState.curSelectorIsEditing }]"
                  :key="classNameState.curSelectorIsEditing"
                  :title="classNameState.curSelector"
                  @click.stop="handleEditCurSelector"
                  @input="handleCurSelectorChange"
                  @blur="handleCompleteEditCurSelector"
                  @keyup.enter="handleCompleteEditCurSelector"
                  @keyup.esc="handleCompleteEditCurSelector"
                >
                  {{ classNameState.curSelector }}
                </span>
                <div
                  v-if="!classNameState.curSelectorIsEditing && classNameState.curSelectorEditable"
                  class="edit-wrap"
                >
                  <svg-icon name="edit" title="编辑" class="edit-btn" @click.stop="handleEditCurSelector"></svg-icon>
                  <svg-icon name="close" title="删除" class="delete-btn" @click.stop="handleDelSelector"></svg-icon>
                </div>
              </div>
            </div>
            <span v-else class="empty-tips">请选择或创建类名</span>
            <input
              ref="newSelectorInputRef"
              type="text"
              v-model="classNameState.newSelector"
              class="selector-input"
              @change="handleInputChange"
              @blur="handleCreateNewClass"
              @keyup.enter="handleCreateNewClass"
              @keydown.delete="handleDeleteCurSelector"
            />
          </div>
          <tiny-select v-model="state.className.mouseState" :options="stateOptions" class="state-selector">
          </tiny-select>
        </div>
        <div v-if="classNameState.selectorHasError" class="error-tips">
          <svg-icon name="error"></svg-icon>
          <span class="error-tips-text">{{ classNameState.selectorHasError }}</span>
        </div>
        <div v-if="classNameState.showDropdownList" class="selector-drop-down-list lowcode-scrollbar-thin">
          <span class="selector-dropdown-list-tips">输入并回车创建新选择器</span>
          <span v-if="currentSelectorList.length" class="selector-dropdown-list-tips">选择已有选择器编辑</span>
          <ul class="exist-class-list">
            <li
              v-for="item in currentSelectorList"
              :key="item"
              :title="item"
              class="exist-class-item"
              @mousedown="handleSelectExistingClass(item)"
            >
              <span>{{ item }}</span>
            </li>
          </ul>
          <span v-if="state.selectors.length" class="selector-dropdown-list-tips add-global-class-tips">
            添加全局类到当前组件并编辑
          </span>
          <ul class="exist-class-list">
            <li
              v-for="item in state.selectors"
              :key="item"
              :title="item"
              class="exist-class-item"
              @mousedown="handleSelectExistingClass(item)"
            >
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, nextTick, watch, watchEffect } from 'vue'
import { Select as TinySelect } from '@opentiny/vue'
import { useProperties, useCanvas, useHistory, useHelp } from '@opentiny/tiny-engine-controller'
import { MetaCodeEditor, LinkButton } from '@opentiny/tiny-engine-common'
import { formatString } from '@opentiny/tiny-engine-controller/js/ast'
import useStyle, { updateGlobalStyleStr } from '../../js/useStyle'
import { stringify, getSelectorArr } from '../../js/parser'

const { getSchema, propsUpdateKey } = useProperties()

const stateOptions = [
  { label: 'None', value: '' },
  { label: 'hover', value: 'hover' },
  { label: 'pressed', value: 'pressed' },
  { label: 'focused', value: 'focused' },
  { label: 'disabled', value: 'disabled' }
]
const SELECTOR_TYPE = {
  CLASS_NAME: 'className',
  ID: 'id'
}

const OPTION_TYPE = {
  ADD: 'add',
  REMOVE: 'remove',
  EDIT: 'edit'
}

const docsUrl = useHelp().getDocsUrl('stylePanel')

const classNameState = reactive({
  curSelector: '',
  curSelectorEditable: false,
  newSelector: '',
  curSelectorIsEditing: false,
  preSelector: '',
  isSelectorValid: true,
  showDropdownList: false,
  showDelConfirm: false,
  selectorHasError: ''
})
const selectorTextRef = ref(null)
const newSelectorInputRef = ref(null)
const state = useStyle().state

const getCurSelectorEditable = (selector) => {
  const selArr = getSelectorArr(selector)

  return selArr.length < 2
}

watch(
  () => state.className.classNameList,
  (className) => {
    classNameState.showDelConfirm = false
    classNameState.selectorHasError = ''

    if (classNameState.curSelectorIsEditing) {
      classNameState.curSelectorIsEditing = false
    }

    classNameState.curSelector = className
    // 多类名的选择器的暂时不支持编辑，比如 .test1.test2
    classNameState.curSelectorEditable = getCurSelectorEditable(className)
  }
)

const setSelectorProps = (type, value) => {
  const { getSchema: getCanvasPageSchema } = useCanvas().canvasApi.value
  const schema = getSchema() || getCanvasPageSchema()

  if (!schema.props) {
    schema.props = {}
  }

  schema.props[type] = value
  propsUpdateKey.value++
}

// 编辑 className 新增、删除、或修改
const editClassName = (curClassName, optionType = OPTION_TYPE.ADD, oldSelector = '') => {
  const { getSchema: getCanvasPageSchema } = useCanvas().canvasApi.value
  const schema = getSchema() || getCanvasPageSchema()
  let type = ''

  if (curClassName.startsWith('.')) {
    type = SELECTOR_TYPE.CLASS_NAME
  } else if (curClassName.startsWith('#')) {
    type = SELECTOR_TYPE.ID
  }

  const classNames = schema.props.className || ''
  const ids = schema.props.id || ''
  const typeMap = {
    [SELECTOR_TYPE.CLASS_NAME]: classNames,
    [SELECTOR_TYPE.ID]: ids
  }
  let newClassNames = curClassName.slice(1)

  // 表达式类型，无法写入或删除
  if (typeof typeMap[type] !== 'string') {
    return
  }

  const editSelectorHandler = () => {
    const oldSelType = oldSelector.startsWith('.') ? SELECTOR_TYPE.CLASS_NAME : SELECTOR_TYPE.ID
    let oldSelSymbol = oldSelector.slice(1)
    let res = newClassNames

    // 前后两种类型不一致，需要将原类型里面的删除，然后在新类型添加
    if (oldSelType !== type) {
      const selArr = typeMap[oldSelType].split(' ').filter((item) => item !== oldSelSymbol) || []

      setSelectorProps(oldSelType, selArr.join(' '))

      res = `${typeMap[type] ?? ''} ${newClassNames}`
    } else {
      // 前后两种类型一致，替换原类型就好
      res = typeMap[type]
        .split(' ')
        .map((item) => {
          if (item === oldSelSymbol) {
            return newClassNames
          }

          return item
        })
        .join(' ')
    }

    return res
  }

  const addSelectorHandler = () => {
    if (type === SELECTOR_TYPE.ID) {
      return newClassNames
    }

    return `${typeMap[type] ?? ''} ${newClassNames}`
  }

  const removeSelectorHandler = () => {
    const leftSelectors = typeMap[type].split(' ').filter((item) => item !== newClassNames && Boolean(item)) || []

    return leftSelectors.join(' ')
  }

  const handlersMap = {
    [OPTION_TYPE.ADD]: addSelectorHandler,
    [OPTION_TYPE.REMOVE]: removeSelectorHandler,
    [OPTION_TYPE.EDIT]: editSelectorHandler
  }

  newClassNames = handlersMap[optionType]?.()

  setSelectorProps(type, newClassNames)
}

// 当前选中组件解析出来的选择器
const currentSelectorList = computed(() => [...state.currentClassNameList, ...state.currentIdList])

/**
 * 选择器简单校验规则
 * 必须以下划线、连字符 - 或字符 a-z 开头，不能是数字
 * @param {string} selector
 */
const selectorValidator = (selector) => {
  let sel = selector.trim()

  classNameState.selectorHasError = ''

  if (sel.startsWith('.') || sel.startsWith('#')) {
    sel = sel.slice(1)
  }

  // 开头不能是数字
  if (/^[0-9]/.test(sel)) {
    classNameState.selectorHasError = '开头不能是数字'

    return false
  }

  // 限制只添加一个类名
  if (sel.includes('.') || sel.includes('#')) {
    classNameState.selectorHasError = '单次只能添加一个类名'

    return false
  }

  // 不能包含空格
  if (/[\s>~+]/.test(sel)) {
    classNameState.selectorHasError = "不能包含空格 '>' '~' '+' 等符号"

    return false
  }

  return true
}

// 添加现有 class 或者 id 到选中的组件中
const handleSelectExistingClass = (selector) => {
  if (!state.selectorOptionLists.find(({ value }) => value === selector)) {
    editClassName(selector, OPTION_TYPE.ADD)
  }

  state.className.classNameList = selector
  state.className.mouseState = ''
}

// 输入框失焦或输入回车即创建新类名
const handleCreateNewClass = () => {
  // 收起下拉组件
  classNameState.showDropdownList = false
  let newSelector = classNameState.newSelector
  const isValid = selectorValidator(newSelector)
  classNameState.selectorHasError = ''

  // 清空选择器
  classNameState.newSelector = ''
  newSelectorInputRef.value?.blur?.()

  if (!isValid) {
    return
  }

  if (!newSelector.startsWith('.') && !newSelector.startsWith('#')) {
    newSelector = `.${newSelector}`
  }

  if (newSelector.length <= 1) {
    return
  }

  // 将类名添加到组件中
  if (!state.selectorOptionLists.find(({ value }) => value === newSelector)) {
    editClassName(newSelector, OPTION_TYPE.ADD)
  }

  state.className.classNameList = newSelector
  state.className.mouseState = ''
}

// 编辑当前选择器
const handleEditCurSelector = async () => {
  if (!classNameState.curSelectorEditable) {
    return
  }

  classNameState.curSelectorIsEditing = true
  classNameState.preSelector = classNameState.curSelector

  await nextTick()

  if (!selectorTextRef.value) {
    return
  }

  // 编辑默认选中文本内容
  const range = document.createRange()
  range.setStart(selectorTextRef.value.childNodes[0], 0)
  range.setEnd(selectorTextRef.value.childNodes[0], selectorTextRef.value.textContent.length)

  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)

  selectorTextRef.value.focus()
}

// 编辑当前选择器，回车、失焦、esc 键都代表确认
const handleCompleteEditCurSelector = () => {
  if (!selectorTextRef.value) {
    return
  }

  const curValue = selectorTextRef.value.textContent
  let textValue = curValue

  if (textValue.startsWith('#') || textValue.startsWith('.')) {
    textValue = textValue.slice(1)
  }

  classNameState.curSelectorIsEditing = false
  classNameState.showDropdownList = false
  classNameState.selectorHasError = ''

  // 修改的选择器不合法
  if (!selectorValidator(textValue) || textValue.length < 1) {
    classNameState.curSelector = classNameState.preSelector
    classNameState.preSelector = ''

    return
  }

  classNameState.curSelector = curValue

  // 修改替换类名
  editClassName(curValue, OPTION_TYPE.EDIT, classNameState.preSelector)

  // 全局样式中包含该类名的，替换之（不包含写在复杂选择器中的类名）
  const newStyleStr = stringify(state.cssParseList, state.styleObject, {
    originSelector: classNameState.preSelector,
    newSelector: curValue
  })

  updateGlobalStyleStr(newStyleStr)
}

const handleDelSelector = () => {
  // 删除选择器，仅从当前选中组件中删除类名, 不删除全局 css 中的 css 类名和样式
  // 后期需要可以拿到全局组件的类名，如果只有当前组件使用该类名，从全局样式中删除之
  editClassName(classNameState.curSelector, OPTION_TYPE.REMOVE)
  state.className.classNameList = ''
  state.className.mouseState = ''
}

const handleFocusInput = () => {
  classNameState.showDropdownList = true

  if (newSelectorInputRef.value) {
    newSelectorInputRef.value.focus()
  }
}

// 校验修改选择器是否合法
const handleCurSelectorChange = (event) => {
  const newValue = event.target?.textContent

  selectorValidator(newValue)
}

// 校验新选择器是否合法
watchEffect(() => {
  selectorValidator(classNameState.newSelector)
})

const save = ({ content }) => {
  const cssString = formatString(content.replace(/"/g, "'"), 'css')
  const { getPageSchema } = useCanvas()
  const { addHistory } = useHistory()
  const { updateRect, setPageCss, getSchema: getCanvasPageSchema } = useCanvas().canvasApi.value
  getPageSchema().css = cssString
  getCanvasPageSchema().css = cssString
  setPageCss(cssString)
  state.schemaUpdateKey++

  addHistory()
  updateRect()
}

// 监听回车删除键，如果当前输入为空，则解绑当前选择器
const handleDeleteCurSelector = () => {
  // 当前新建的选择器不为空，则在编辑当前选择器
  if (classNameState.newSelector) {
    return
  }

  // 在编辑当前选择器则不做更改
  if (classNameState.curSelectorIsEditing) {
    return
  }

  // 解绑当前选择器
  handleDelSelector()
}
</script>

<style lang="less" scoped>
.className-container {
  ::-webkit-scrollbar {
    display: block;
  }
  padding: 16px 16px 8px;
}
.title {
  margin: 0;
  font-size: 14px;
  color: var(--ti-lowcode-className-selector-title-color);
  font-weight: normal;
  .help-link {
    vertical-align: middle;
  }
}

.selector-container {
  display: flex;
  margin-top: 10px;
  color: var(--ti-lowcode-className-selector-container-color);

  .selector-right-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    position: relative;
    margin-left: 8px;
  }
  .selector-right-container-wrap {
    display: flex;
  }
  .className-selector-wrap {
    max-width: 180px;
    min-width: 0;
  }
  :deep(.editor-wrap) {
    width: 30px;
  }
  .edit-global-css {
    display: flex;
    padding: 7px;
    border: 1px solid var(--ti-lowcode-className-selector-container-border-color);
    border-radius: 6px;
    cursor: pointer;
  }

  .className-selector-container {
    display: flex;
    row-gap: 2px;
    align-items: center;
    flex-wrap: wrap;
    max-width: 180px;
    min-width: 0;
    padding: 1px 10px;
    border: 1px solid var(--ti-lowcode-className-selector-container-border-color);
    border-radius: 6px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    font-size: 12px;
    &:hover {
      border-color: var(--ti-lowcode-className-selector-container-hover-border-color);
    }
    &.has-error {
      border-color: var(--ti-lowcode-className-selector-container-error-border-color);
      background-color: var(--ti-lowcode-className-selector-container-error-bg-color);
    }
    &:has(.selector-input:focus) {
      .empty-tips {
        display: none;
      }
    }
    .empty-tips {
      position: absolute;
      color: var(--ti-lowcode-className-selector-container-empty-tips-color);
      z-index: 0;
    }
    .current-selector {
      max-width: 100%;
      .current-selector-label {
        display: flex;
        align-items: center;
        background-color: var(--ti-lowcode-className-selector-container-label-bg-color);
        color: var(--ti-lowcode-className-selector-container-label-color);
        padding: 1px 4px;
        border-radius: 4px;
        line-height: 26px;
        .selector-label-text {
          outline: none;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          &.text-editing {
            text-overflow: unset;
          }
        }
        .edit-wrap {
          display: flex;
          .del-selector-popover {
            display: inline-flex;
            .svg-icon {
              outline: none;
            }
            :deep(.reference-wrapper) {
              display: inline-flex;
            }
          }
        }
        .edit-btn,
        .delete-btn {
          color: var(--ti-lowcode-className-selector-container-option-btn-color);
          margin-left: 4px;
          cursor: pointer;
        }
      }
    }
    .selector-input {
      color: var(--ti-lowcode-className-selector-container-color);
      min-width: 0;
      flex: 0 0 0;
      line-height: 28px;
      z-index: 1;
      border: none;
      outline: none;
      background-color: transparent;
      padding: 0;
      &:focus {
        flex: 1 0 46px;
        padding: 1px 2px;
      }
    }
  }

  .error-tips {
    display: flex;
    align-items: center;
    margin-top: 8px;
    font-size: 12px;
    color: var(--ti-lowcode-className-selector-error-tips-color);
    .error-tips-text {
      margin-left: 4px;
    }
  }

  .selector-drop-down-list {
    box-sizing: border-box;
    position: absolute;
    display: flex;
    width: 100%;
    max-height: 200px;
    top: calc(100% + 10px);
    left: 0;
    padding: 8px 0;
    background-color: var(--ti-lowcode-className-selector-dropdown-list-bg-color);
    border: 1px solid transparent;
    border-radius: 6px;
    z-index: 1;
    flex-direction: column;
    overflow: scroll;
    box-shadow: 0 4px 6px 0 rgba(0, 0, 0, 0.15);

    .selector-dropdown-list-tips {
      font-size: 12px;
      padding: 0 10px;
      line-height: 32px;
      color: var(--ti-lowcode-className-selector-dropdown-list-tips-color);
    }

    .selector-dropdown-list-tips + .selector-dropdown-list-tips {
      margin-top: 10px;
    }
    .add-global-class-tips {
      margin-top: 10px;
    }

    .exist-class-item {
      cursor: pointer;
      height: 32px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      font-size: 12px;
      > span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      &.active,
      &:hover {
        background-color: var(--ti-lowcode-className-selector-dropdown-list-item-active-bg-color);
        color: var(--ti-lowcode-className-selector-dropdown-list-item-color);
      }
    }
  }

  .state-selector {
    flex: 4;
    min-width: 84px;
    border: 1px solid var(--ti-lowcode-className-selector-container-border-color);
    border-radius: 6px;
    border-left: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    :deep(input) {
      padding-right: 30px;
      border: none;
      font-size: 12px;
    }
  }
}
</style>
