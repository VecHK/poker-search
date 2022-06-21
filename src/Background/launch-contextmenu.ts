import { ChromeContextMenus } from '../utils/chrome-contetxmenu'
import { controlIsLaunched } from '../x-state/control-window-launched'
import launchControlWindow from './launch'

const contextMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-LAUNCH',
      contexts: ['page'],
      title: '启动Poker'
    },
    async (info, tab) => {
      if (tab) {
        if (await controlIsLaunched()) {
          console.error('poker control window is launched')
        } else {
          const { windowId } = tab
          launchControlWindow({
            text: undefined,
            revert_container_id: windowId
          })
        }
      }
    }
  )
)

export const presetLaunchContextMenu = () => contextMenu().presetContextMenu()
export const removeLaunchContextMenu = () => contextMenu().removeContextMenu()

export default function LaunchContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contextMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
