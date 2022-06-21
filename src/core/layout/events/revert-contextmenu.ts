import cfg from '../../../config'
import { ApplyChromeContextMenus } from '../../../utils/chrome-contextmenu'
import { WindowID } from '../window'

export default function InitRevertContextMenu({
  isSearchWindow,
  onClickedContextMenuInSearchWindow
}: {
  isSearchWindow: (id: WindowID) => boolean,
  onClickedContextMenuInSearchWindow: (window_id: WindowID) => void
}) {
  return (
    ApplyChromeContextMenus({
      id: cfg.SEARCH_WINDOW_MENU_REVERT,
      contexts: ['page'],
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
