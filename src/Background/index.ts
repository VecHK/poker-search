import cfg from '../config'
import { ApplyChromeEvent } from '../utils/chrome-event'
import GlobalCommand from './gloal-command'
import { regRules } from './moble-access'
import Omnibox from './omnibox'
import SelectionContextMenu from './selection-contentmenu'

console.log('Poker Background')

Object.assign(global, {
  __hot_reload_before__,
})

const [ applyGlobalCommand, cancelGlobalCommand ] = GlobalCommand()
const [ applyOmnibox, cancelOmnibox ] = Omnibox()
const [ applyContextMenu, cancelContextMenu ] = SelectionContextMenu()

async function __hot_reload_before__(): Promise<void> {
  cancelGlobalCommand()
  cancelOmnibox()
  cancelContextMenu()
}

function __launch_background__() {
  regRules()

  applyGlobalCommand()
  applyOmnibox()
  applyContextMenu()
}

function createInstalledWindow(is_update: boolean) {
  const append_params = is_update ? '?update=1' : ''

  chrome.windows.create({
    focused: false,
    type: 'popup',
    width: cfg.INSTALLED_WINDOW_WIDTH,
    height: cfg.INSTALLED_WINDOW_HEIGHT,
    left: 0,
    top: 0,
    url: chrome.runtime.getURL(`/installed.html${append_params}`)
  })
}

ApplyChromeEvent(
  chrome.runtime.onInstalled,
  (details) => {
    console.log('chrome.runtime.onInstalled', details)

    if (details.reason === 'install') {
      createInstalledWindow(false)
      __launch_background__()
    } else if (details.reason === 'update') {
      createInstalledWindow(true)
      __launch_background__()
    }
  }
)
