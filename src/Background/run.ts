import { ApplyChromeEvent } from '../utils/chrome-event'
import { MessageEvent, sendMessage } from '../message'
import { cleanControlLaunch, controlIsLaunched, getControlWindowId } from '../x-state/control-window-launched'

import { regRules } from './modules/mobile-access'
import GlobalCommand from './modules/gloal-command'
import Omnibox from './modules/omnibox'
import SelectionContextMenu from './modules/selection-contextmenu'
import LaunchContextMenu, { presetLaunchContextMenu, removeLaunchContextMenu } from './modules/launch-contextmenu'
import TryPoker from './modules/try-poker'

const [ applyGlobalCommand, ] = GlobalCommand()
const [ applyOmnibox, ] = Omnibox()
const [ applySelectionContextMenuClick, ] = SelectionContextMenu()
const [ applyLaunchContextMenuClick, ] = LaunchContextMenu()
const [ applyTryPoker, ] = TryPoker()

export default function runBackground() {
  console.log('runBackground')

  regRules()

  applyGlobalCommand()
  applyOmnibox()
  applySelectionContextMenuClick()
  applyLaunchContextMenuClick()
  applyTryPoker()

  ApplyChromeEvent(
    chrome.windows.onRemoved,
    async (removed_id) => {
      const control_id = await getControlWindowId()
      console.log('onRemoved', control_id, removed_id)
      if (control_id !== null) {
        if (control_id === removed_id) {
          cleanControlLaunch()
        }
      }
    }
  )

  const [ applyReceive ] = MessageEvent('ChangeSearch', (search_keyword) => {
    controlIsLaunched().then(is_launched => {
      if (is_launched) {
        sendMessage('ChangeSearch', search_keyword)
      }
    })
  })
  applyReceive()

  const [ applyLaunchContextMenuChange ] = MessageEvent('ChangeLaunchContextMenu', (launch_poker_contextmenu) => {
    if (launch_poker_contextmenu) {
      presetLaunchContextMenu()
    } else {
      removeLaunchContextMenu()
    }
  })
  applyLaunchContextMenuChange()

  console.log('runBackground end')
}
