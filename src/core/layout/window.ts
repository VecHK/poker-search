import { nth } from 'ramda'

type SearchWindowState = 'NORMAL' | 'EMPTY' | 'PLAIN'
export type SearchWindow = Readonly<{
  state: SearchWindowState
  windowId: number
}>
export type SearchWindowRow = Array<SearchWindow>
export type SearchWindowMatrix = Array<SearchWindowRow>

export const closeAllWindow = (ids: number[]) => {
  return ids.map(windowId => {
    return chrome.windows.remove(windowId)
  })
}

export function getWindowId(win: chrome.windows.Window): number {
  const { id: window_id } = win

  if (window_id === undefined) {
    throw Error('window_id is undefined')
  } else {
    return window_id
  }
}

export async function getSearchWindowTabId(window_id: number): Promise<number> {
  const tabs = await chrome.tabs.query({ windowId: window_id })
  const tab = nth(0, tabs)
  if (tab === undefined) {
    throw Error(`tab of SearchWindow(${window_id}) is not found`)
  } else if (tab.id === undefined) {
    throw Error(`tab.id is not found`)
  } else {
    return tab.id
  }
}
