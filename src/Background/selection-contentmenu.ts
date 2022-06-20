import { Memo } from 'vait'
import { WindowID } from '../core/layout/window'
import { ChromeEvent } from '../utils/chrome-event'


export default function InitSelectionContextMenu(
  callback: (keyword: string, window_id: WindowID) => void
) {
  console.log('InitSelectionContextMenu')

  const CURRENT_MENU_ID = 'POKER-SELECTION'

  const [ applyClickedEvent, cancelClickedEvent ] = ChromeEvent(
    chrome.contextMenus.onClicked,
    (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      if (tab) {
        const { selectionText } = info
        const { windowId } = tab
        if (selectionText !== undefined) {
          callback(selectionText, windowId)
        }
      }
    }
  )

  const [isCreated, setCreated] = Memo(false)

  return [
    function appendContenxtMenu() {
      console.log('appendContenxtMenu')

      if (isCreated() !== true) {
        chrome.contextMenus.create({
          enabled: true,
          id: CURRENT_MENU_ID,
          contexts: ['selection'],
          title: '使用 Poker 搜索',
        })
        setCreated(true)
        applyClickedEvent()
      }
    },

    function removeContextMenu() {
      console.log('removeContextMenu')

      if (isCreated() === true) {
        chrome.contextMenus.remove(CURRENT_MENU_ID)
        cancelClickedEvent()
        setCreated(false)
      }
    }
  ] as const
}
