import cfg from '../config'
import { MessageEvent, sendMessage } from '../message'
import { ApplyChromeEvent } from '../utils/chrome-event'
import { controlIsLaunched, initControlWindowLaunched } from '../x-state/control-window-launched'
import GlobalCommand from './gloal-command'
import { presetLaunchContentMenu } from './launch-contentmenu'
import { regRules } from './moble-access'
import Omnibox from './omnibox'
import SelectionContextMenu, { presetSelectionContentMenu } from './selection-contentmenu'

console.log('Poker Background')

Object.assign(global, {
  __hot_reload_before__,
})

const [ applyGlobalCommand, cancelGlobalCommand ] = GlobalCommand()
const [ applyOmnibox, cancelOmnibox ] = Omnibox()
const [ applyContextMenuClick, cancelContextMenuClick ] = SelectionContextMenu()

async function __hot_reload_before__(): Promise<void> {
  cancelGlobalCommand()
  cancelOmnibox()
  cancelContextMenuClick()
}

function createInstalledWindow(is_update: boolean) {
  const append_params = is_update ? '?update=1' : ''

  return chrome.windows.create({
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
  async (details) => {
    console.log('chrome.runtime.onInstalled', details)

    presetSelectionContentMenu()
    presetLaunchContentMenu()

    await initControlWindowLaunched()

    if (details.reason === 'install') {
      createInstalledWindow(false)
    } else if (details.reason === 'update') {
      createInstalledWindow(true)
    }
  }
)

function runBackground() {
  regRules()

  applyGlobalCommand()
  applyOmnibox()
  applyContextMenuClick()

  const [ applyReceive ] = MessageEvent('ChangeSearch', msg => {
    controlIsLaunched().then(is_launched => {
      if (is_launched) {
        sendMessage('ChangeSearch', msg.payload)
      }
    })
  })
  applyReceive()
}
runBackground()
