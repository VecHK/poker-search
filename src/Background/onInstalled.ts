import cfg from '../config'

import { presetLaunchContextMenu } from './modules/launch-contextmenu'
import { presetSelectionContextMenu } from './modules/selection-contextmenu'

import { load as loadPreferences } from '../preferences'

export default async function BackgroundOnInstalled(
  details: chrome.runtime.InstalledDetails
) {
  console.log('chrome.runtime.onInstalled', details)

  presetSelectionContextMenu()

  initLaunchContextMenu()

  if (details.reason === 'install') {
    openInstalledWindow(false)
  } else if (details.reason === 'update') {
    openInstalledWindow(true)
  }
}

function initLaunchContextMenu() {
  console.log('initLaunchContextMenu')
  loadPreferences().then(preferences => {
    if (preferences.launch_poker_contextmenu) {
      presetLaunchContextMenu()
    }
  })
}

function openInstalledWindow(is_update: boolean) {
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
