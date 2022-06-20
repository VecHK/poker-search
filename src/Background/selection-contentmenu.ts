import ChromeContextMenus from '../utils/chrome-contetxmenu'
import launchControlWindow from './launch'

export default function SelectionContextMenu() {
  console.log('InitSelectionContextMenu')

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
          launchControlWindow({
            text: selectionText,
            revert_container_id: windowId
          })
        }
      }
    }
  )
}
