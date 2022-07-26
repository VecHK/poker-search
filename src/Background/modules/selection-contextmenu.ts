import { RevertContainerID } from '../../core/base'
import { sendMessage } from '../../message'
import { ChromeContextMenus } from '../../utils/chrome-contextmenu'
import { controlIsLaunched } from '../../x-state/control-window-launched'
import launchControlWindow from './launch'

export async function searchPoker(
  search_text: string,
  revert_container_id: RevertContainerID
) {
  if (await controlIsLaunched()) {
    sendMessage('ChangeSearch', search_text)
  } else {
    launchControlWindow({
      text: search_text,
      revert_container_id
    })
  }
}

const contextMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-SELECTION',
      contexts: ['selection'],
      title: '使用Poker搜索'
    },
    async (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      // if (tab) {
      //   const { selectionText } = info
      //   const { windowId } = tab
      //   if (selectionText !== undefined) {
      //     searchPoker(selectionText, windowId)
      //   }
      // }
    }
  )
)

// 每个插件只能有一个邮件菜单入口，原来的搜索菜单移到和分组搜索同一级，同列二级菜单
const allGroupsSearchMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-ALL-GROUPS-SEARCH',
      contexts: ['selection'],
      // title: '使用Poker搜索'
      title: '在所有组搜索',
      parentId: 'POKER-SELECTION'
    },
    async (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      if (tab) {
        const { selectionText } = info
        const { windowId } = tab
        if (selectionText !== undefined) {
          searchPoker(selectionText, windowId)
        }
      }
    }
  )
)

const groupMenus = () => {
  // 不知道怎么获取用户配置的组名，先放几个 dummies
  let group_names: string[] = ['翻译', 'ACG']
  let group_menus = group_names.map(name => (
    ChromeContextMenus(
      {
        id: name,
        contexts: ['selection'],
        title: name,
        parentId: 'POKER-SELECTION',
      },
      async (info, tab) => {
        console.log('clicked group ' + name);
        let keyword = info.selectionText
        if (keyword !== undefined) {
          // 等分组搜索功能做好
        }
      }
    )
  ))
  return group_menus
}

export const presetSelectionContextMenu = () => contextMenu().presetContextMenu()

export const presetSubMenus = () => {
  allGroupsSearchMenu().presetContextMenu()
  groupMenus().forEach(menu => menu.presetContextMenu())
}

export function groupSearchMenus() {
  return groupMenus().map(obj => [obj.applyClickedEvent, obj.cancelClickedEvent])
}


export function SelectionContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = allGroupsSearchMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
