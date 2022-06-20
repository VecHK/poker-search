import { sendMessage } from '../message'
import ChromeContextMenus from '../utils/chrome-contetxmenu'
import launchControlWindow, { controlWindowMemo } from './launch'

export default function SelectionContextMenu() {
  console.log('InitSelectionContextMenu')

  const [ isLaunched ] = controlWindowMemo

  return ChromeContextMenus(
    {
      id: 'POKER-SELECTION',
      contexts: ['selection'],
      title: '使用Poker搜索'
    },
    (info, tab) => {
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
}
