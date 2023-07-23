import { Atomic, Memo } from 'vait'
import { submitSearch } from '../../../core/control-window'
import { load as loadPreferences } from '../../../preferences'
import { ChromeEvent } from '../../../utils/chrome-event'
import matchSearchPattern from '../../../utils/match-search-pattern'

import { AutoClearEvent, runOmniboxIndividualSearch } from './individual-search'

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

export default function OmniboxEvent() {
  const [
    applyAutoClearIndividualSearch,
    cancalAutoClearIndividualSearch
  ] = AutoClearEvent()

  // omnibox 提交（即按下回车键的时候）
  const [
    applyOmniBoxInputEntered, cancelOmniBoxInputEntered
  ] = ChromeEvent(
    chrome.omnibox.onInputEntered,
    async (content, disposition) => {
      const ind_search = getIndividualSearchInfo()

      if (ind_search && (ind_search.id === content)) {
        const { url_pattern, search_text } = ind_search
        runOmniboxIndividualSearch(disposition, url_pattern, search_text)
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
      applyAutoClearIndividualSearch()
      applyOmniBoxInputEntered()
      applyOmniboxSuggest()
    },
    function cancel() {
      cancalAutoClearIndividualSearch()
      cancelOmniBoxInputEntered()
      cancelOmniboxSuggest()
    }
  ] as const
}
