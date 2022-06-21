import { sendMessage } from '../message'
import { ChromeContextMenus } from '../utils/chrome-contextmenu'
import { controlIsLaunched } from '../x-state/control-window-launched'
import launchControlWindow from './launch'

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
          if (await controlIsLaunched()) {
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

export const presetSelectionContextMenu = () => contextMenu().presetContextMenu()

export default function SelectionContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contextMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
