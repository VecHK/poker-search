import { Atomic, Memo } from 'vait'
import { TabID, WindowID } from '../../core/layout/window'
import { submitSearch } from '../../core/control-window'
import { load as loadPreferences } from '../../preferences'
import { toSearchURL } from '../../preferences/site-settings'
import { ChromeEvent } from '../../utils/chrome-event'
import matchSearchPattern from '../../utils/match-search-pattern'

type IndividualSearch = { id: string; url_pattern: string; search_text: string }
const [getIndividualSearchInfo, setIndividualSearchInfo] = Memo<IndividualSearch | null>(null)

function getURLSiteName(url_pattern: string): string {
  try {
    const u = new URL(url_pattern)
    return u.hostname
  } catch {
    return url_pattern
  }
}

const createdTabs = new Map<TabID, TabID[]>()
const getCreatedTabs = (tab_id: TabID): TabID[] => {
  if (createdTabs.has(tab_id)) {
    return createdTabs.get(tab_id) as TabID[]
  } else {
    createdTabs.set(tab_id, [])
    return getCreatedTabs(tab_id) as TabID[]
  }
}
const addCreatedTabs = (start_tab_id: TabID, new_tab_id: TabID) => {
  createdTabs.set(start_tab_id, [...getCreatedTabs(start_tab_id), new_tab_id])
}
const removeCreatedTabs: (tab_id: TabID) => void = createdTabs.delete.bind(createdTabs)

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

async function omniboxIndividualSearch (
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

export default function OmniboxEvent() {
  const [
    applyAutoClear,
    cancalAutoClear
  ] = ChromeEvent(
    chrome.tabs.onRemoved,
    removeCreatedTabs
  )

  // omnibox 提交（即按下回车键的时候）
  const [
    applyOmniBoxInputEntered, cancelOmniBoxInputEntered
  ] = ChromeEvent(
    chrome.omnibox.onInputEntered,
    async (content, disposition) => {
      const ind_search = getIndividualSearchInfo()

      if (ind_search && (ind_search.id === content)) {
        const { url_pattern, search_text } = ind_search
        omniboxIndividualSearch(disposition, url_pattern, search_text)
      } else {
        const { id } = await chrome.windows.getCurrent()
        submitSearch(content, id)
      }
    }
  )

  const loadingAtomic = Atomic()

  // 修改 omnibox 推荐字段
  const [
    applyOmniboxSuggest, cancelOmniboxSuggest
  ] = ChromeEvent(
    chrome.omnibox.onInputChanged,
    (text, suggest) => {
      function setNormalSearch() {
        setIndividualSearchInfo(null)
        suggest([])
        chrome.omnibox.setDefaultSuggestion({
          description: `Poker搜索: ${text}`,
        })
      }
      function setIndividualSearch(
        site_name: string,
        search_text: string,
        url_pattern: string
      ) {
        const content = text
        setIndividualSearchInfo({
          id: content,
          search_text,
          url_pattern
        })

        chrome.omnibox.setDefaultSuggestion({
          description: `使用 ${site_name} 搜索: ${search_text}`,
        })
        suggest([
            {
            // 不加空格的话，显示不出来，可能 chrome 是将 content 作为
            // id 了，就与前面的 setDefaultSuggestion 有冲突了
            // 另外这个 content 也是作为 individualSearch 的 id 的
            content: text + ' ',
            description: `Poker搜索: ${text}`,
          }
        ])
      }

      loadingAtomic(async () => {
        const [
          is_individual_searching,
          site,
          remain_text
        ] = matchSearchPattern(text)

        if (is_individual_searching) {
          const preferenes = await loadPreferences()

          const site_opt = preferenes.site_settings.map(f => {
            return f.row
          })
            .flat()
            .find(site_opt => (
              site_opt.url_pattern.indexOf(site) !== -1
            ))

          if (site_opt && remain_text.length) {
            const site_name = getURLSiteName(site_opt.url_pattern)
            setIndividualSearch(site_name, remain_text, site_opt.url_pattern)
          } else {
            return setNormalSearch()
          }
        } else {
          return setNormalSearch()
        }
      })
    }
  )

  return [
    function apply() {
      applyAutoClear()
      applyOmniBoxInputEntered()
      applyOmniboxSuggest()
    },
    function cancel() {
      cancalAutoClear()
      cancelOmniBoxInputEntered()
      cancelOmniboxSuggest()
    }
  ] as const
}
