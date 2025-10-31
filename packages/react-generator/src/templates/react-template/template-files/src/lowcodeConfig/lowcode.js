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

import React, { createContext, useContext, useState } from 'react';

// 简单的低代码运行时上下文
const LowcodeContext = createContext({});

export const LowcodeProvider = ({ children, value }) => (
  <LowcodeContext.Provider value={value}>{children}</LowcodeContext.Provider>
);

export const useLowcode = () => useContext(LowcodeContext);

// 兼容原有导出
export default LowcodeProvider;
