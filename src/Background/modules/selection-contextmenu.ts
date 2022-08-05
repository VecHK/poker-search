import { submitSearch } from '../../core/control-window'
import { ChromeContextMenus } from '../../utils/chrome-contextmenu'

const contextMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-SELECTION',
      contexts: ['selection'],
      title: '使用Poker搜索'
    },
    async (info, tab) => {
      console.log('contextMenu clicked', info, tab)

      if (tab) {
        const { selectionText } = info
        const { windowId } = tab
        if (selectionText !== undefined) {
          submitSearch(selectionText, windowId)
        }
      }
    }
  )
)

export const presetSelectionContextMenu = () => contextMenu().presetContextMenu()

export default function SelectionContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contextMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
