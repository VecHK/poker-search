import { RevertContainerID } from '../../core/base'
import { controlIsLaunched } from '../../hooks/useControlWindowExists'
import { sendMessage } from '../../message'
import { ChromeContextMenus } from '../../utils/chrome-contextmenu'
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

export const presetSelectionContextMenu = () => contextMenu().presetContextMenu()

export default function SelectionContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contextMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
