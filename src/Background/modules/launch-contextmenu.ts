import { callControlWindow } from '../../core/control-window'
import { ChromeContextMenus } from '../../utils/chrome-contextmenu'

const contextMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-LAUNCH',
      contexts: ['page'],
      title: '启动Poker'
    },
    callControlWindow
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
