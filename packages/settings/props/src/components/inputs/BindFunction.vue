<template>
  <tiny-button @click="setFunction">自定义方法</tiny-button>
  <bind-events-dialog
    v-show="dialogVisible"
    ref="child"
    v-bind="state"
    @closeDialog="close"
    @bindFunction="bindFunction"
  ></bind-events-dialog>
</template>

<script>
import { reactive, ref } from 'vue'
import { Button } from '@opentiny/vue'
import { useProperties, useMaterial, useCanvas } from '@opentiny/tiny-engine-meta-register'
import BindEventsDialog from '@/settings/events/src/components/BindEventsDialog.vue'

export default {
  components: {
    TinyButton: Button,
    BindEventsDialog
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const { setProp } = useProperties()
    const { pageState } = useCanvas()
    const { getMaterial } = useMaterial()
    const currentSchema = pageState.currentSchema
    const keys = Object.keys(currentSchema.props)
    const dialogVisible = ref(false)
    const componentName = pageState.currentSchema?.componentName
    const actions = getMaterial(componentName) || {}
    const bindActions = {}

    actions.events?.forEach((action) => {
      const idx = keys.indexOf(action.id)

      if (idx > -1) {
        bindActions[action.id] = currentSchema.props[action.id].events
      }
    })

    const state = reactive({
      dialogVisible: false,
      title: props.name,
      actionName: '',
      isEdit: false,
      name: '',
      isBindFunction: true,
      bindActions: bindActions
    })
    const getTitle = () => {
      return props.name.split('.')[2]
    }

    const bindJsState = reactive({
      title: getTitle(),
      actionName: 'oo',
      isEdit: true
    })

    const setFunction = () => {
      state.isEdit = true
      dialogVisible.value = true
    }

    const close = () => {
      dialogVisible.value = false
    }

    const bindFunction = (events) => {
      setProp(props.name, events)
    }

    return {
      bindJsState,
      setFunction,
      dialogVisible,
      close,
      state,
      bindFunction
    }
  }
}
</script>
