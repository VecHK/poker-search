import { TabID, WindowID } from '../../../core/layout/window'
import { toSearchURL } from '../../../preferences/site-settings'
import { ChromeEvent } from '../../../utils/chrome-event'

const createdTabs = new Map<TabID, TabID[]>()
const getCreatedTabs = (tab_id: TabID): TabID[] => {
  if (createdTabs.has(tab_id)) {
    return createdTabs.get(tab_id) as TabID[]
  } else {
    createdTabs.set(tab_id, [])
    return getCreatedTabs(tab_id) as TabID[]
  }
}
const removeCreatedTabs: (tab_id: TabID) => void = createdTabs.delete.bind(createdTabs)
const addCreatedTabs = (start_tab_id: TabID, new_tab_id: TabID) => {
  createdTabs.set(start_tab_id, [...getCreatedTabs(start_tab_id), new_tab_id])
}

// createdTabs 在tab页关掉的时候进行清理
export function AutoClearEvent() {
  const [ apply, cancal ] = ChromeEvent(
    chrome.tabs.onRemoved,
    removeCreatedTabs
  )
  return [apply, cancal]
}

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
  start_tab_id: TabID,
  current_window_tabs: chrome.tabs.Tab[],
): number | undefined {
  const start_tab = current_window_tabs.find(t => t.id === start_tab_id)
  if (start_tab?.id) {
    const created_tabs = getCreatedTabs(start_tab.id)
    return 1 + getLatestIndex(current_window_tabs, created_tabs, start_tab.index)
  } else {
    return undefined
  }
}

const getCurrentTabByWindowId = async (windowId: WindowID) => {
  const tabs = await chrome.tabs.query({ windowId })
  return [
    tabs.find(tab => tab.active),
    tabs
  ] as const
}

export async function runOmniboxIndividualSearch(
  disposition: chrome.omnibox.OnInputEnteredDisposition,
  url_pattern: string,
  search_text: string
) {
  const url = toSearchURL(url_pattern, search_text)

  // disposition 的应对情况没有依照普通 omnibox 的逻辑
  // 按下 Shift+Command+Enter键 的时候，是创建一个新窗口
  // 按下 Command+Enter键、Enter键 的时候，是创建一个 tab
  if (disposition === 'newForegroundTab') {
    chrome.windows.create({ url })
  } else {
    // 不知道为什么在这种情况下调用 chrome.tabs.getCurrent
    // 会得到 undefined，于是只能使用 getCurrentTabByWindowId 这样一个迂回的办法
    const [current_tab, current_window_tabs] = await getCurrentTabByWindowId(chrome.windows.WINDOW_ID_CURRENT)

    const new_tab = await chrome.tabs.create({
      url,
      windowId: chrome.windows.WINDOW_ID_CURRENT,

      // 只有按下 Enter 的时候 tab 才是活动状态
      active: disposition === 'currentTab',

      // 新创建的 tab 都会显示在当前 tab 的下一个位置中，而不是 tab 栏最末尾的位置
      index: current_tab?.id && calcNewTabIndex(current_tab?.id, current_window_tabs)
    })

    if (current_tab?.id && new_tab?.id) {
      addCreatedTabs(current_tab.id, new_tab.id)
    }
  }
}
