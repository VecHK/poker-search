import { ApplyChromeEvent } from '../utils/chrome-event'

import GlobalCommand from './modules/gloal-command'
import Omnibox from './modules/omnibox'
import LaunchContextMenu from './modules/launch-contextmenu'
import SelectionContextMenu from './modules/selection-contextmenu'

import BackgroundOnInstalled from './onInstalled'
import runBackground from './run'
import TryPoker from './modules/try-poker'

console.log('Poker Background')

const [ , cancelGlobalCommand ] = GlobalCommand()
const [ , cancelOmnibox ] = Omnibox()
const [ , cancelSelectionContextMenuClick ] = SelectionContextMenu()
const [ , cancelLaunchContextMenuClick ] = LaunchContextMenu()
const [ , cancelTryPoker ] = TryPoker()

if (process.env.NODE_ENV === 'development') {
  Object.assign(global, {
    async __hot_reload_before__(): Promise<void> {
      cancelGlobalCommand()
      cancelOmnibox()
      cancelSelectionContextMenuClick()
      cancelLaunchContextMenuClick()
      cancelTryPoker()
    }
  })
}

ApplyChromeEvent(chrome.runtime.onInstalled, BackgroundOnInstalled)

runBackground()
