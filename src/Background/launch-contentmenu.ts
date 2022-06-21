import { ChromeContextMenus } from '../utils/chrome-contetxmenu'
import { controlIsLaunched } from '../x-state/control-window-launched'
import launchControlWindow from './launch'

const contentMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-LAUNCH',
      contexts: ['page'],
      title: '启动Poker'
    },
    async (info, tab) => {
      if (tab) {
        const { selectionText } = info
        const { windowId } = tab
        if (selectionText !== undefined) {
          if (await controlIsLaunched()) {
            console.error('poker control window is launched')
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

export const presetLaunchContentMenu = () => contentMenu().presetContextMenu()
export const removeLaunchContentMenu = () => contentMenu().removeContextMenu()

export default function LaunchContextMenu() {
  const { applyClickedEvent, cancelClickedEvent } = contentMenu()

  return [
    applyClickedEvent,
    cancelClickedEvent,
  ]
}
