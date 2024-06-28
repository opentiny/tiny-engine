<template>
  <div class="blocks-header-wrap">
    <tiny-select
      ref="groupSelect"
      v-model="selectedGroup"
      class="blocks-header-select"
      placeholder="请选择"
      value-key="groupId"
      @change="$emit('changeGroup')"
      @visible-change="handleSelectVisibleChange"
    >
      <tiny-option
        v-for="item in state.groups"
        :key="item.value.groupId"
        :class="[
          'blocks-header-option',
          state.currentEditId === item.value.groupId && 'block-editing-option',
          state.currentDeleteGroupId === item.value.groupId && 'show-underline'
        ]"
        :label="item.label"
        :value="item.value"
      >
        <tiny-form
          v-if="state.currentEditId === item.value.groupId"
          ref="editFormRef"
          label-width="0"
          :model="state.groupNameModel"
          :rules="state.rules"
          @click.stop=""
        >
          <tiny-form-item prop="value" class="edit-form-item">
            <tiny-input ref="editFormItemRef" v-model="state.groupNameModel.value" placeholder="请输入新的分组名称">
              <template #suffix>
                <div class="confirm-btns">
                  <tiny-tooltip class="action-item" effect="dark" content="确定" placement="bottom" :open-delay="500">
                    <tiny-button
                      type="text"
                      size="mini"
                      :icon="TinyIconYes"
                      id="confirmChangeGroupName"
                      class="confirm-btns-item"
                      @click.stop="handleChangeGroupName(item.value)"
                    ></tiny-button>
                  </tiny-tooltip>
                  <tiny-tooltip class="action-item" effect="dark" content="取消" placement="bottom" :open-delay="500">
                    <tiny-button
                      type="text"
                      size="mini"
                      :icon="TinyIconClose"
                      id="cancelChangeGroupName"
                      class="confirm-btns-item"
                      @click.stop="state.currentEditId = null"
                    ></tiny-button>
                  </tiny-tooltip>
                </div>
              </template>
            </tiny-input>
          </tiny-form-item>
        </tiny-form>
        <div v-else class="block-option-content" @click.stop="handleClickOption(item)">
          <div class="option-label">{{ item.label }}</div>
          <div v-if="!isDefaultGroupId(item.value.groupId) && !isAllGroupId(item.value.groupId)" class="option-right">
            <svg-button
              id="updateGroupName"
              class="option-btn"
              name="edit"
              tips="编辑"
              @click.stop="updateGroup(item.value)"
            ></svg-button>
            <tiny-popover
              :modelValue="state.currentDeleteGroupId === item.value.groupId"
              placement="right"
              trigger="manual"
              popper-class="block-option-popper-wrapper"
              @update:modelValue="handleChangeDeletePopoverVisible"
            >
              <div class="popper-confirm" @mousedown.stop="">
                <div class="popper-confirm-header">
                  <svg-icon class="icon" name="warning"></svg-icon>
                  <span class="title">您确定删除该分组吗？</span>
                </div>
                <div class="popper-confirm-footer">
                  <tiny-button
                    id="confirmDeleteGroupName"
                    class="confirm-btn"
                    size="small"
                    type="primary"
                    @click="handleConfirmDeleteGroup(item.value)"
                  >
                    确定
                  </tiny-button>
                  <tiny-button
                    id="cancelDeleteGroupName"
                    size="small"
                    class="cancel-btn"
                    @click="handleCancelDeleteGroup"
                    >取消</tiny-button
                  >
                </div>
              </div>
              <template #reference>
                <svg-button
                  id="deleteGroup"
                  class="option-btn"
                  name="delete"
                  tips="删除"
                  @click.stop="handleShowDeleteModal(item.value.groupId)"
                ></svg-button>
              </template>
            </tiny-popover>
          </div>
        </div>
      </tiny-option>
    </tiny-select>

    <svg-button
      v-if="!isShortcutPanel"
      class="add-group-btn"
      tips="新建分组"
      name="add-page"
      @click="handleAddGroup"
    ></svg-button>
  </div>
  <tiny-dialog-box v-model:visible="state.showCreateGroupForm" title="新建分组" width="400px" :append-to-body="true">
    <tiny-form ref="createGroupForm" :model="state.createGroupForm" :rules="state.newGroupRules" validate-type="text">
      <tiny-form-item prop="groupName" label="分组名称" :validate-icon="validateIcon" label-width="64px">
        <tiny-input v-model="state.createGroupForm.groupName" placeholder="请输入分组名称"></tiny-input>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <tiny-button id="confirmAddGroup" type="primary" @click="handleConfirmAddGroup">确 定</tiny-button>
      <tiny-button id="cancelAddGroup" @click="state.showCreateGroupForm = false">取 消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="jsx">
import { inject, reactive, ref, nextTick } from 'vue'
import {
  Input,
  Option,
  Select,
  Form as TinyForm,
  FormItem as TinyFormItem,
  DialogBox,
  Button,
  Tooltip,
  Notify,
  Popover
} from '@opentiny/vue'
import { iconYes, iconClose, iconError } from '@opentiny/vue-icon'
import { useApp, useBlock, useModal } from '@opentiny/tiny-engine-controller'
import { SvgButton } from '@opentiny/tiny-engine-common'
import { requestCreateGroup, requestDeleteGroup, fetchGroups, requestUpdateGroup } from './http'
import { setBlockPanelVisible } from './js/usePanel'
import { REGEXP_GROUP_NAME } from '@opentiny/tiny-engine-controller/js/verification'

export default {
  components: {
    TinyForm,
    TinyInput: Input,
    TinyFormItem,
    TinySelect: Select,
    TinyOption: Option,
    SvgButton,
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinyTooltip: Tooltip,
    TinyPopover: Popover
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const validateIcon = iconError()
    const panelState = inject('panelState', {})
    const { addDefaultGroup, isDefaultGroupId, groupChange, selectedGroup, isAllGroupId } = useBlock()
    const { confirm, message } = useModal()
    const groupSelect = ref(null)
    const editFormRef = ref(null)
    const editFormItemRef = ref(null)
    const appId = useApp().appInfoState.selectedId

    const createGroupForm = ref(null)

    const state = reactive({
      groups: props.modelValue,
      groupName: '未命名分组',
      currentEditId: null,
      groupNameModel: {
        value: ''
      },
      rules: {
        value: [{ pattern: REGEXP_GROUP_NAME, required: true, message: '只能输入汉字或数字或英文或-符号或_符号' }]
      },
      newGroupRules: {
        groupName: [
          { required: true, message: '分组名称必填' },
          { pattern: REGEXP_GROUP_NAME, message: '只能输入汉字或数字或英文或-符号或_符号' }
        ]
      },
      prevClickGroupId: null,
      dbClickTimer: null,
      showCreateGroupForm: false,
      createGroupForm: {
        groupName: ''
      },
      currentDeleteGroupId: null
    })

    const changeName = (value) => {
      return value
    }

    const deleteGroup = (group) => {
      const { groupId, groupName } = group
      const title = '删除分组'
      const status = 'custom'
      const messageRender = {
        render: () => <span>{`您确定要删除 ${groupName} 吗?`}</span>
      }
      const exec = () => {
        requestDeleteGroup(groupId)
          .then(() => {
            fetchGroups(appId).then((data) => {
              state.groups = addDefaultGroup(data)
              if (selectedGroup.value.groupId === groupId) {
                groupChange(state.groups[0].value)
                setBlockPanelVisible(false)
              }
            })
          })
          .catch((error) => {
            message({ message: `删除区块分组失败: ${error.message || error}`, status: 'error' })
          })
      }

      confirm({ title, status, message: messageRender, exec })

      groupSelect.value.blur()
    }

    const handleChangeGroupName = () => {
      if (!state.currentEditId) {
        return
      }
      editFormRef.value?.[0].validate((valid) => {
        if (!valid) {
          return
        }
        requestUpdateGroup({ id: state.currentEditId, name: state.groupNameModel.value, app: appId })
          .then(() => fetchGroups(appId))
          .catch((error) => {
            message({ message: `更新区块分组失败: ${error.message || error}`, status: 'error' })
          })
          .then((groups) => {
            state.groups = addDefaultGroup(groups)
          })
          .finally(() => {
            state.groupNameModel.value = ''
            state.currentEditId = ''
          })
      })
    }

    const updateGroup = async (group) => {
      const { groupId, groupName } = group
      state.currentDeleteGroupId = null
      state.currentEditId = groupId
      state.groupNameModel.value = groupName
      await nextTick()
      editFormItemRef.value?.[0]?.focus()
    }

    const handleAddGroup = () => {
      state.showCreateGroupForm = true
    }

    const handleClickOption = ({ value: { groupId, groupName } }) => {
      if (groupId === 'default') {
        groupChange({ groupId, groupName })
        groupSelect.value.blur()
        return
      }
      clearTimeout(state.dbClickTimer)
      if (state.prevClickGroupId !== groupId) {
        state.prevClickGroupId = groupId
        state.dbClickTimer = setTimeout(() => {
          state.prevClickGroupId = null
          groupChange({ groupId, groupName })
          groupSelect.value.blur()
        }, 460)
        return
      }
      state.prevClickGroupId = null
      updateGroup({ groupId, groupName })
    }

    const handleConfirmAddGroup = () => {
      createGroupForm.value.validate((valid) => {
        if (!valid) {
          return
        }

        requestCreateGroup({ name: state.createGroupForm.groupName, app: appId })
          .then((data) => {
            state.showCreateGroupForm = false
            fetchGroups(appId).then((groups) => {
              state.groups = addDefaultGroup(groups)
            })
            groupChange(data)
            setBlockPanelVisible(true)
          })
          .catch((error) => {
            message({ message: `新建区块分组失败: ${error.message || error}`, status: 'error' })
          })
      })
    }

    const handleConfirmDeleteGroup = (group) => {
      const { groupId, groupName } = group
      const messageSuccess = `${groupName}分组删除成功!`
      requestDeleteGroup(groupId)
        .then(() => {
          state.currentDeleteGroupId = null
          fetchGroups(appId).then((data) => {
            state.groups = addDefaultGroup(data)
            if (selectedGroup.value.groupId === groupId) {
              groupChange(state.groups[0].value)
              setBlockPanelVisible(false)
            }
          })
          Notify({
            type: 'success',
            message: messageSuccess,
            position: 'top-right'
          })
        })
        .catch((error) => {
          message({ message: `删除区块分组失败: ${error.message || error}`, status: 'error' })
        })
    }

    const handleCancelDeleteGroup = () => {
      state.currentDeleteGroupId = null
    }

    const handleShowDeleteModal = async (id) => {
      state.currentDeleteGroupId = null
      await nextTick()
      state.currentDeleteGroupId = id
    }

    const handleChangeDeletePopoverVisible = (visible) => {
      if (!visible) {
        state.currentDeleteGroupId = null
        state.currentEditId = ''
      }
    }

    const handleSelectVisibleChange = (visible) => {
      handleChangeDeletePopoverVisible(visible)
    }

    const TinyIconYes = iconYes()
    const TinyIconClose = iconClose()

    return {
      isDefaultGroupId,
      selectedGroup,
      groupSelect,
      state,
      deleteGroup,
      updateGroup,
      changeName,
      isShortcutPanel: panelState.isShortcutPanel,
      handleChangeGroupName,
      editFormRef,
      handleClickOption,
      createGroupForm,
      handleConfirmAddGroup,
      handleAddGroup,
      editFormItemRef,
      handleConfirmDeleteGroup,
      handleCancelDeleteGroup,
      handleShowDeleteModal,
      handleChangeDeletePopoverVisible,
      handleSelectVisibleChange,
      isAllGroupId,
      validateIcon,
      TinyIconYes,
      TinyIconClose
    }
  }
}
</script>

<style lang="less" scoped>
.blocks-header-wrap {
  display: flex;
  justify-content: space-between;
  padding: 0 8px 8px;

  .blocks-header-select {
    width: calc(100% - 36px);
  }

  .blocks-header-icon {
    width: 28px;
    height: 28px;
    font-size: 16px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    background: var(--ti-lowcode-canvas-wrap-bg);
    border: 1px solid var(--ti-lowcode-toolbar-border-color);
    border-radius: 2px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
      color: var(--ti-lowcode-toolbar-icon-color);
      background: var(--ti-lowcode-button-hover-bg);
    }
  }
  .add-group-btn {
    font-size: 16px;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border-color: var(--ti-lowcode-materials-border-icon-border-color);
    background-color: var(--ti-lowcode-materials-border-icon-bg-color);
    &:hover {
      border-color: var(--ti-lowcode-materials-border-icon-border-color-hover);
    }
  }
}

.blocks-header-option {
  display: flex;
  justify-content: space-between;
  &:hover {
    .option-right {
      display: inline-block;
    }
  }
  &.block-editing-option {
    padding: 0;
    border-bottom: 1px solid var(--ti-lowcode-materials-block-group-item-border-color);
    :deep(.tiny-input__inner) {
      border-color: transparent;
    }
  }
  .confirm-btns {
    button + button {
      margin-left: 0;
    }
    :deep(svg) {
      color: var(--ti-lowcode-component-svg-button-color);
    }
  }
  &.show-underline {
    border-bottom: 1px solid var(--ti-lowcode-materials-block-group-item-border-color);
  }
  .block-option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
  }
  .option-label,
  .option-right {
    line-height: 1;
  }
  .option-right {
    display: none;
  }
}
.tiny-form .tiny-form-item.edit-form-item {
  margin-bottom: 0;
}

:deep(.tiny-form .tiny-form-item.is-error) {
  margin-bottom: 34px;
}
</style>

<style lang="less">
.tiny-popover.tiny-popper.block-option-popper-wrapper {
  width: 220px;
  height: 108px;
  box-sizing: border-box;
  background-color: var(--ti-lowcode-materials-block-group-delete-popover-bg-color);
  padding: 6px;

  &[x-placement^='right'] {
    .popper__arrow {
      &,
      &::after {
        border-right-color: var(--ti-lowcode-common-component-hover-bg);
      }
    }
  }

  .popper-confirm {
    padding: 20px;
  }

  .popper-confirm-header {
    font-size: 12px;
    color: var(--ti-lowcode-materials-block-group-delete-popover-title-color);
    .icon {
      color: var(--ti-lowcode-warning-color);
      width: 16px;
      height: 16px;
    }
    .title {
      margin-left: 4px;
    }
  }
  .popper-confirm-footer {
    text-align: center;
    margin-top: 22px;
  }
}
</style>
