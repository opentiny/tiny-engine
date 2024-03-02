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

// I know it looks like ugly. But we need type check /(ToT)/~~

/**
 *
 *
 * @typedef {object} Label
 * @prop {string} zh_CN
 * @prop {string} en_US
 *
 *
 * @typedef {Object} LayerItem
 * @prop {string|number} id
 * @prop {Label} label
 * @prop {string} code
 * @prop {string} clazz
 * @prop {import('@opentiny/tiny-engine-controller/useX6').Property[]} properties
 *
 * @typedef {LayerItem[]} Layer
 *
 * @typedef {Object} Type
 *
 * @prop {string} id
 * @prop {Label} label
 * @prop {string} type
 * @prop {boolean} optional
 * @prop {string} [default]
 * @typedef {{[x:string]:Type[]}} Types
 *
 * @typedef {Object} ResState
 * @prop {import('@opentiny/tiny-engine-controller/useX6').MaterialInfo[]} materials
 * @prop {Types} types
 * @prop {Layer} layer
 *
 */
import { getGlobalConfig } from './globalConfig'
import { reactive, ref, computed } from 'vue'
import { useHttp, useEndpoint } from '@opentiny/tiny-engine-http'
import { isProdEnv, isMock } from '@opentiny/tiny-engine-common/js/environments'
const http = isProdEnv ? useHttp() : useEndpoint();

const resState = reactive({
  /**@type {import('@opentiny/tiny-engine-controller/useX6').MaterialInfo[]} */
  nn: [],
  /** @type {Types} */
  types: {},
  /** @type {Layer} */
  layer: []
})

/**
 *
 * @param {[ResState]} data
 */
const registerNN = (data) => {
  return new Promise((resolve) => {
    data?.layer?.forEach((layer) => {
      resState.layer.push(layer)
    })
    data?.materials?.forEach((n)=>{
      resState.nn.push(n);
    })

    resState.types = data.types
    resolve(data)
  })
}

/**
 * @description 获取所有的基础网络
 */
const fetchNN = async () => {
  const { dslMode, canvasOptions, materialHost } = getGlobalConfig()
  const bundleUrls = canvasOptions[dslMode].material
  const loading = ref(true)
  const error = ref(false)
  const reason = ref()
  const nn = computed(() => resState.nn)
  let p;
  if (isMock){
    p = Promise.allSettled(bundleUrls.map((url) => http.get(url)))
  } else {
    p = Promise.allSettled([http.get(materialHost)])
  }
  p.then((res) => {
    return res.map((v) => (v.status === 'fulfilled' ? v.value : {}))
  })
  .then((res)=>{
    registerNN(res[0]);
  })
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

export default function () {
  return {
    resState,
    fetchNN
  }
}
