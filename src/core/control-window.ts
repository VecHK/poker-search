import { nth } from 'ramda'
import { getControlWindowUrl } from '../Background/modules/launch'
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
