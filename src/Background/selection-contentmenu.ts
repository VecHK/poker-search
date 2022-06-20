import { sendMessage } from '../message'
import { ChromeContextMenus } from '../utils/chrome-contetxmenu'
import launchControlWindow, { controlWindowMemo } from './launch'

const contentMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-SELECTION',
      contexts: ['selection'],
      title: '使用Poker搜索'
    },
    (info, tab) => {
      const [ isLaunched ] = controlWindowMemo

      console.log('contextMenu clicked', info, tab)

      if (tab) {
        const { selectionText } = info
        const { windowId } = tab
        if (selectionText !== undefined) {
          if (isLaunched()) {
            sendMessage('ChangeSearch', selectionText)
          } else {
            launchControlWindow({
              text: selectionText,
              revert_container_id: windowId
            })
          }
        }
      }
    }
  )
)

export const initContentMenu = () => {
  contentMenu().setContextMenu()
}

export default function SelectionContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contentMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
