import { MessageEvent, sendMessage } from '../message'

import initFirstAccessMobileDetecting from './modules/first-access-mobile-detecting'
import GlobalCommand from './modules/gloal-command'
import Omnibox from './modules/omnibox'
import SelectionContextMenu from './modules/selection-contextmenu'
import LaunchContextMenu, { presetLaunchContextMenu, removeLaunchContextMenu } from './modules/launch-contextmenu'
import TryPoker from './modules/try-poker'
import { controlIsLaunched } from '../core/control-window'

const [ applyGlobalCommand, ] = GlobalCommand()
const [ applyOmnibox, ] = Omnibox()
const [ applySelectionContextMenuClick, ] = SelectionContextMenu()
const [ applyLaunchContextMenuClick, ] = LaunchContextMenu()
const [ applyTryPoker, ] = TryPoker()

export default function runBackground() {
  console.log('runBackground')

  initFirstAccessMobileDetecting()

  applyGlobalCommand()
  applyOmnibox()
  applySelectionContextMenuClick()
  applyLaunchContextMenuClick()
  applyTryPoker()

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
