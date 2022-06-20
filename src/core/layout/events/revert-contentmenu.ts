import { Memo } from 'vait'
import cfg from '../../../config'
import { ChromeEvent } from '../../../utils/chrome-event'
import { WindowID } from '../window'

export default function InitContextMenu({
  isSearchWindow,
  onClickedContextMenuInSearchWindow
}: {
  isSearchWindow: (id: WindowID) => boolean,
  onClickedContextMenuInSearchWindow: (window_id: WindowID) => void
}) {
  const [ applyEvent, cancelEvent ] = ChromeEvent(
    chrome.contextMenus.onClicked,
    (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      if (tab) {
        if (isSearchWindow(tab.windowId)) {
          onClickedContextMenuInSearchWindow(tab.windowId)
        }
      }
    }
  )

  const [isCreated, setCreated] = Memo(false)

  return [
    function appendContenxtMenu() {
      if (isCreated() !== true) {
        chrome.contextMenus.create({
          enabled: true,
          id: cfg.SEARCH_WINDOW_MENU_REVERT,
          contexts: ['all'],
          title: '打开新窗口',
        })
        setCreated(true)
        applyEvent()
      }
    },

    function removeContextMenu() {
      if (isCreated() === true) {
        chrome.contextMenus.remove(cfg.SEARCH_WINDOW_MENU_REVERT)
        cancelEvent()
        setCreated(false)
      }
    }
  ] as const
}
