import { ChromeContextMenus } from '../../utils/chrome-contextmenu'
import { callPoker } from './gloal-command'

const contextMenu = () => (
  ChromeContextMenus(
    {
      id: 'POKER-LAUNCH',
      contexts: ['page'],
      title: '启动Poker'
    },
    callPoker
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
