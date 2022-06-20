import cfg from '../../../config'
import ChromeContextMenus from '../../../utils/chrome-contetxmenu'
import { WindowID } from '../window'

export default function InitRevertContextMenu({
  isSearchWindow,
  onClickedContextMenuInSearchWindow
}: {
  isSearchWindow: (id: WindowID) => boolean,
  onClickedContextMenuInSearchWindow: (window_id: WindowID) => void
}) {
  return (
    ChromeContextMenus({
      id: cfg.SEARCH_WINDOW_MENU_REVERT,
      contexts: ['all'],
      title: '打开新窗口',
    }, (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      if (tab) {
        if (isSearchWindow(tab.windowId)) {
          onClickedContextMenuInSearchWindow(tab.windowId)
        }
      }
    })
  )
}
