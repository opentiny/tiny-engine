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

import { ref, defineAsyncComponent } from 'vue'
import { useModal } from '@opentiny/tiny-engine-controller'
const VueMonaco = defineAsyncComponent(() => import('../component/VueMonaco.vue'))


export function getEslintCustomRules() {
  return localStorage.getItem('monaco-eslint-custom-rules')
}
export function setEslintCustomRules(rulesString) {
  localStorage.setItem('monaco-eslint-custom-rules', rulesString)
}

export function useEslintCustomModal() {
  const customRules = ref(getEslintCustomRules())
  const { message } = useModal();
  const edit = (save) => {
    const configString = ref(customRules.value || '{}')
    message({
      title: `自定义 ESLint Rules 配置`,
      message: () => (<VueMonaco value={configString.value} language={'json'} onChange={
        (v) => {
          configString.value = v
        }
      } style='height: 60vh'></VueMonaco>),
      exec: () => {
        customRules.value = configString.value;
        setEslintCustomRules(customRules.value )
        save?.(customRules.value)
      },
      width: 800
    })
  }
  
  return {
    customRules,
    edit
  }
} 


