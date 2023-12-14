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

import { execCommandWithCatch } from '../tool/Common'

export default class CnpmService {
  authToken = ''
  registry = 'registry.npmmirror.com'
  async loginInNpm(packagePath) {
    const commands = [
      'npm config set strict-ssl false',
      'npm config set always-auth true',
      `npm config set //${this.registry}/:_authToken ${this.authToken}`,
      `npm config set registry https://${this.registry}`,
      `npm whoami --registry https://${this.registry}`
    ]
    return execCommandWithCatch(commands, { cwd: packagePath }, 'login npm')
  }

  async publishCnpm(packagePath) {
    const commands = ['npm publish']
    return execCommandWithCatch(commands, { cwd: packagePath }, 'publish cnpm')
  }
}
