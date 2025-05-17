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
import { ref } from 'vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { useHoverNode as useVueHoverNode, useSelectNode as useVueSelectNode } from './vue-interactions'
import { useHoverNode as useDefaultHoverNode, useSelectNode as useDefaultSelectNode } from './html-interactions'

const interactionHooksMap = {
  vue: {
    useHoverNode: useVueHoverNode,
    useSelectNode: useVueSelectNode
  },
  html: {
    useHoverNode: useDefaultHoverNode,
    useSelectNode: useDefaultSelectNode
  }
}

type IInteractionHooksMap = typeof interactionHooksMap

const getInteractionFn = () => {
  const selectMode = getMergeMeta('engine.config')?.selectMode?.toLowerCase?.() as keyof IInteractionHooksMap

  if (interactionHooksMap[selectMode]) {
    return interactionHooksMap[selectMode]
  }

  return interactionHooksMap.vue
}

const interactionsFn = ref<IInteractionHooksMap[keyof IInteractionHooksMap] | null>(null)

export const useHoverNode = () => {
  if (!interactionsFn.value) {
    interactionsFn.value = getInteractionFn()
  }

  return interactionsFn.value.useHoverNode()
}

export const useSelectNode = () => {
  if (!interactionsFn.value) {
    interactionsFn.value = getInteractionFn()
  }

  return interactionsFn.value.useSelectNode()
}
