import cfg from '../config'
import { MessageEvent, sendMessage } from '../message'
import { ApplyChromeEvent } from '../utils/chrome-event'
import { controlIsLaunched, initControlWindowLaunched } from '../x-state/control-window-launched'
import GlobalCommand from './gloal-command'
import { regRules } from './moble-access'
import Omnibox from './omnibox'
import LaunchContextMenu, { presetLaunchContextMenu, removeLaunchContextMenu } from './launch-contextmenu'
import SelectionContextMenu, { presetSelectionContextMenu } from './selection-contextmenu'

import { load as loadPreferences } from '../preferences'

console.log('Poker Background')

Object.assign(global, {
  __hot_reload_before__,
})

const [ applyGlobalCommand, cancelGlobalCommand ] = GlobalCommand()
const [ applyOmnibox, cancelOmnibox ] = Omnibox()
const [ applySelectionContextMenuClick, cancelSelectionContextMenuClick ] = SelectionContextMenu()
const [ applyLaunchContextMenuClick ] = LaunchContextMenu()

async function __hot_reload_before__(): Promise<void> {
  cancelGlobalCommand()
  cancelOmnibox()
  cancelSelectionContextMenuClick()
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

    presetSelectionContextMenu()

    initLaunchContextMenu()

    await initControlWindowLaunched()

    if (details.reason === 'install') {
      createInstalledWindow(false)
    } else if (details.reason === 'update') {
      createInstalledWindow(true)
    }
  }
)

function initLaunchContextMenu() {
  console.log('initLaunchContextMenu')
  loadPreferences().then(preferences => {
    if (preferences.launch_poker_contextmenu) {
      presetLaunchContextMenu()
    }
  })
}

runBackground()
function runBackground() {
  regRules()

  applyGlobalCommand()
  applyOmnibox()
  applySelectionContextMenuClick()
  applyLaunchContextMenuClick()

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
}
