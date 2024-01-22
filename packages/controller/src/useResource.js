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
/**
 * @typedef {Object} Type
 * @prop {number}
 * @prop {{zh_CN: string, en_US: string}} label
 * @prop {string} type
 * @prop {boolean} optional
 * @prop {string} [default]
 * @typedef {{[x:string]:Type[]}} Types
 */
import { getGlobalConfig } from './globalConfig'
import { reactive, ref, computed } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'
const http = useHttp()

const resState = reactive({
  /**@type {import('@opentiny/tiny-engine-controller/useX6').MaterialInfo[]} */
  nn: [],
  /** @type {Types} */
  types: {}
})

/**
 *
 * @param {import('@opentiny/tiny-engine-controller/useX6').Materials[]} data
 */
const registerNN = (data) => {
  return new Promise((resolve) => {
    data
      .map((v) => v.materials)
      .flat()
      .map((v) => {
        resState.nn.push(v)
      })
    resolve()
  })
}

/**
 *
 * @param {Types[]} types
 */
const registerType = (types) => {
  return new Promise((resolve) => {
    resState.types = types
    resolve()
  })
}

/**
 * @description 获取所有的基础网络
 */
const fetchNN = async () => {
  const { dslMode, canvasOptions } = getGlobalConfig()
  const bundleUrls = canvasOptions[dslMode].material
  const loading = ref(true)
  const error = ref(false)
  const reason = ref()
  const nn = computed(() => resState.nn)
  Promise.allSettled(bundleUrls.map((url) => http.get(url)))
    .then((res) => {
      return res.map((v) => (v.status === 'fulfilled' ? v.value : []))
    })
    .then(registerNN)
    .catch((err) => {
      error.value = true
      reason.value = err
    })
    .finally(() => {
      loading.value = false
    })
  return {
    nn,
    loading,
    error,
    reason
  }
}

const fetchType = () => {
  const { dslMode, canvasOptions } = getGlobalConfig()
  const bundleUrls = canvasOptions[dslMode].material
  const loading = ref(true)
  const error = ref(false)
  const reason = ref()
  const types = computed(() => resState.types)
  if (JSON.stringify(types.value) === '{}') {
    Promise.allSettled(bundleUrls.map((url) => http.get(url)))
      .then((res) => {
        return res.map((v) => (v.status === 'fulfilled' ? v.value : []))
      })
      .then(([types]) => registerType(types))
      .catch((err) => {
        error.value = true
        reason.value = err
      })
      .finally(() => {
        loading.value = false
      })
  }
  return {
    types,
    loading,
    error,
    reason
  }
}

export default function () {
  return {
    resState,
    fetchNN,
    fetchType
  }
}
