import { nth } from 'ramda'
import { WindowOptionType } from '../base/window-option-matrix'

export type WindowID = number
export type TabID = number

export type SearchWindow = Readonly<{
  type: WindowOptionType

  windowId: WindowID
  tabId: TabID
  is_debugger_attach: boolean

  init_width?: number
  init_height?: number
}>
export type SearchWindowRow = Array<SearchWindow>
export type SearchWindowMatrix = Array<SearchWindowRow>

export const closeWindows = (ids: WindowID[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}

export function getWindowId(win: chrome.windows.Window): WindowID {
  const { id: window_id } = win

  if (window_id === undefined) {
    throw Error('window_id is undefined')
  } else {
    return window_id
  }
}

export async function getSearchWindowTab(window_id: WindowID): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ windowId: window_id })
  const tab = nth(0, tabs)
  if (tab === undefined) {
    throw Error(`tab of SearchWindow(${window_id}) is not found`)
  } else {
    return tab
  }
}

export async function getSearchWindowTabId(window_id: WindowID): Promise<WindowID> {
  const tab = await getSearchWindowTab(window_id)
  if (tab.id === undefined) {
    throw Error(`tab.id is undefined`)
  } else {
    return tab.id
  }
}

export async function getSearchWindowTabURL(window_id: WindowID): Promise<string> {
  const { url } = await getSearchWindowTab(window_id)
  if (url === undefined) {
    throw Error(`tab.url is undefined`)
  } else {
    return url
  }
}
