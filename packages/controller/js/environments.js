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

export const MODE = import.meta.env.MODE
export const PROD = import.meta.env.PROD
export const BASE_URL = import.meta.env.BASE_URL
export const VITE_ORIGIN = import.meta.env.VITE_ORIGIN
export const VITE_API_MOCK = import.meta.env.VITE_API_MOCK
export const VITE_CDN_DOMAIN = import.meta.env.VITE_CDN_DOMAIN

export const isMock = VITE_API_MOCK === 'mock'

export const isVsCodeEnv = window.vscodeBridge

export const isDevelopEnv = MODE?.includes('dev')

export const isAlphaEnv = MODE?.includes('alpha')

export const isProdEnv = MODE?.includes('prod')
