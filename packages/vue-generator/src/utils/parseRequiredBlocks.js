const isJsSlot = (data) => {
  // 判断是否是 plain object
  if (typeof data !== 'object' || data === null) {
    return false
  }

  // 判断是否是 JSSlot 类型
  return data?.type === 'JSSlot' && Array.isArray(data?.value)
}

const isNodeLike = (data) => {
  // 判断是否是 plain object
  if (typeof data !== 'object' || data === null) {
    return false
  }

  // 判断是否是 Node 类型
  return typeof data?.componentName === 'string' && data?.componentName
}

// props 深度限制
const MAX_PROPS_DEPTH = 1000

function traverseProps(value, depth, resRef, propsSeenRef, nodesSeenRef) {
  if (depth > MAX_PROPS_DEPTH) {
    return
  }

  if (value === null || value === undefined) {
    return
  }

  if (typeof value !== 'object') {
    return
  }

  if (propsSeenRef.has(value)) {
    return
  }
  propsSeenRef.add(value)

  // JSSlot：仅遍历 value 数组
  if (isJsSlot(value)) {
    const arr = value.value || []
    for (const item of arr) {
      if (isNodeLike(item)) {
        if (item.componentType === 'Block' && typeof item.componentName === 'string' && item.componentName) {
          resRef.push(item.componentName)
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        collectFromNode(item, resRef, propsSeenRef, nodesSeenRef)
      } else {
        // 非节点，继续向下递归
        traverseProps(item, depth + 1, resRef, propsSeenRef, nodesSeenRef)
      }
    }
    return
  }

  // NodeLike：作为节点处理（先 children 后 props）
  if (isNodeLike(value)) {
    if (value.componentType === 'Block' && typeof value.componentName === 'string' && value.componentName) {
      resRef.push(value.componentName)
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    collectFromNode(value, resRef, propsSeenRef, nodesSeenRef)
    return
  }

  // 数组：遍历每个元素
  if (Array.isArray(value)) {
    for (const item of value) {
      traverseProps(item, depth + 1, resRef, propsSeenRef, nodesSeenRef)
    }
    return
  }

  // 对象：遍历所有 key
  for (const key of Object.keys(value)) {
    traverseProps(value[key], depth + 1, resRef, propsSeenRef, nodesSeenRef)
  }
}

function collectFromNode(node, resRef, propsSeenRef, nodesSeenRef) {
  if (typeof node !== 'object' || node === null) {
    return
  }
  if (nodesSeenRef.has(node)) {
    return
  }
  nodesSeenRef.add(node)

  // 1) 遍历 children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child !== 'object' || child === null) {
        continue
      }

      if (child.componentType === 'Block' && typeof child.componentName === 'string' && child.componentName) {
        resRef.push(child.componentName)
      }

      // 对每个子节点按“先 children 后 props”的节点级顺序继续递归
      collectFromNode(child, resRef, propsSeenRef, nodesSeenRef)
    }
  }

  // 2) 遍历 props（全键、全类型、任意深度，单条 props 路径最大 1000）
  traverseProps(node.props, 0, resRef, propsSeenRef, nodesSeenRef)
}

export const parseRequiredBlocks = (schema) => {
  const res = []
  const propsSeen = new WeakSet()
  const nodesSeen = new WeakSet()

  if (typeof schema !== 'object' || schema === null) {
    return res
  }

  // 入口节点
  collectFromNode(schema, res, propsSeen, nodesSeen)

  return Array.from(new Set(res))
}
