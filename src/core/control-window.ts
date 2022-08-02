import { nth } from 'ramda'
import launchControlWindow, { getControlWindowUrl } from '../Background/modules/launch'
import { sendMessage } from '../message'
import { RevertContainerID } from './base'
import { WindowID } from './layout/window'

export async function getControlWindowID(): Promise<WindowID | undefined> {
  const tab = nth(
    0,
    await chrome.tabs.query({
      url: getControlWindowUrl(),
      windowType: 'popup'
    })
  )
  return tab?.windowId
}

export async function controlIsLaunched() {
  const control_window_id = await getControlWindowID()
  return control_window_id !== undefined
}

export async function focusControlWindow() {
  const win_id = await getControlWindowID()
  if (win_id !== undefined) {
    await chrome.windows.update(win_id, { focused: true })
    return true
  } else {
    return false
  }
}

export async function submitSearch(
  search_text: string,
  revert_container_id: RevertContainerID
) {
  if (await controlIsLaunched()) {
    await sendMessage('ChangeSearch', search_text)
  } else {
    await launchControlWindow({
      text: search_text,
      revert_container_id
    })
  }
}
