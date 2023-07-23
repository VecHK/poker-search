import { equals, prop } from 'ramda'
import { TabID, WindowID } from '../../../core/layout/window'
import { ChromeEvent } from '../../../utils/chrome-event'
import { toSearchURL } from '../../../preferences/site-settings'

const createdTabs = new Map<TabID, TabID[]>()
const getCreatedTabs = (from_tab_id: TabID): TabID[] => {
  if (createdTabs.has(from_tab_id)) {
    return createdTabs.get(from_tab_id) as TabID[]
  } else {
    createdTabs.set(from_tab_id, [])
    return getCreatedTabs(from_tab_id)
  }
}
const removeCreatedTabs: (tab_id: TabID) => void = createdTabs.delete.bind(createdTabs)
const addCreatedTabs = (
  from_tab_id: TabID,
  new_tab_id: TabID
) => createdTabs.set(from_tab_id, [...getCreatedTabs(from_tab_id), new_tab_id])

// 在 tab 页关掉的时候自动清理 createdTabs
export const AutoClearEvent = () => ChromeEvent(chrome.tabs.onRemoved, removeCreatedTabs)

function getLatestIndex(
  window_tabs: chrome.tabs.Tab[],
  created_tabs: TabID[],
  current_tab_idx: number,
): number {
  const next_tab_idx = current_tab_idx + 1
  const next_tab = window_tabs.find(t => t.index === next_tab_idx)
  if (next_tab?.id) {
    if (created_tabs.indexOf(next_tab.id) !== -1) {
      return getLatestIndex(window_tabs, created_tabs, next_tab_idx)
    } else {
      return current_tab_idx
    }
  } else {
    return current_tab_idx
  }
}

function calcNewTabIndex(
  from_tab_id: TabID,
  current_window_tabs: chrome.tabs.Tab[],
): number | undefined {
  const start_tab = current_window_tabs.find(t => t.id === from_tab_id)
  if (start_tab?.id) {
    const created_tabs = getCreatedTabs(start_tab.id)
    return 1 + getLatestIndex(current_window_tabs, created_tabs, start_tab.index)
  } else {
    return undefined
  }
}

const getCurrentTabByWindowId = (windowId: WindowID) =>
  chrome.tabs.query({ windowId }).then(
    (tabs) => [
      tabs.find(prop('active')),
      tabs
    ] as const
  )

const isPressEnterKey = equals<chrome.omnibox.OnInputEnteredDisposition>('currentTab')

export async function runOmniboxIndividualSearch(
  disposition: chrome.omnibox.OnInputEnteredDisposition,
  url_pattern: string,
  search_text: string
) {
  const url = toSearchURL(url_pattern, search_text)

  if (disposition === 'newForegroundTab') {
    chrome.windows.create({ url })
  } else {
    const { WINDOW_ID_CURRENT } = chrome.windows

    // 不知道为什么在这种情况下调用 chrome.tabs.getCurrent 会得到 undefined
    // 于是只能使用 getCurrentTabByWindowId 这样一个迂回的办法
    const [current_tab, current_window_tabs] = await getCurrentTabByWindowId(WINDOW_ID_CURRENT)

    const new_tab = await chrome.tabs.create({
      url,
      windowId: WINDOW_ID_CURRENT,
      active: isPressEnterKey(disposition),
      index: current_tab?.id && calcNewTabIndex(current_tab.id, current_window_tabs)
    })

    if (current_tab?.id && new_tab?.id) {
      addCreatedTabs(current_tab.id, new_tab.id)
    }
  }
}
