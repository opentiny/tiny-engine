import { MenuId, MenuRegistry } from 'monaco-editor/esm/vs/platform/actions/common/actions'
import { toDisposable } from 'monaco-editor/esm/vs/base/common/lifecycle'

function findNode(list, condition) {
  let node = list._first
  while (node !== undefined) {
    if (condition(node.element)) {
      return node
    }
    node = node.next
  }
  return null
}

export function addContextMenu(
  editor,
  {
    id,
    label,
    keybindings,
    keybindingContext,
    precondition,
    contextMenuGroupId,
    contextMenuOrder,
    run,
    parentMenu,
    menuContext, // debug name
    title,
    group,
    order,
    menuItems
  }
) {
  if (run) {
    const action = {
      id,
      label,
      keybindings,
      keybindingContext,
      precondition,
      contextMenuGroupId,
      contextMenuOrder,
      run
    }
    let dispose = editor.addAction(action) // 默认加入MenuId.EditorContext
    if (parentMenu) {
      // 如果有指定父菜单需要取出来删掉加入parentMenu中
      const items = MenuRegistry._menuItems.get(MenuId.EditorContext)
      const actionId = editor.getSupportedActions().find((a) => a.label === action.label && a.id.endsWith(action.id)).id
      const node = findNode(items, (cur) => cur.command?.id === actionId)
      items._remove(node)
      const item = node.element
      dispose = MenuRegistry.appendMenuItem(parentMenu, item)
    }
    return dispose
  }
  const subMenuId = new MenuId(menuContext)
  const disposeParent = MenuRegistry.appendMenuItem(parentMenu || MenuId.EditorContext, {
    context: menuContext,
    submenu: subMenuId,
    title,
    group,
    order
  })
  const disposeGroup = menuItems.map((item, i) => {
    return addContextMenu(editor, {
      ...item,
      contextMenuGroupId: menuContext,
      contextMenuOrder: i,
      parentMenu: subMenuId
    })
  })
  return toDisposable(() => {
    disposeParent.dispose()
    disposeGroup.forEach((single) => {
      single.dispose()
    })
  })
}
