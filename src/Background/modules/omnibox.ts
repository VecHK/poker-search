import { Atomic, Memo } from 'vait'
import { sendMessage } from '../../message'
import { load as loadPreferences } from '../../preferences'
import { toSearchURL } from '../../preferences/site-settings'
import { ChromeEvent } from '../../utils/chrome-event'
import matchSearchPattern from '../../utils/match-search-pattern'
import { controlIsLaunched } from '../../x-state/control-window-launched'
import launchControlWindow from './launch'

type IndividualSearch = { id: string; url_pattern: string; keyword: string }
const [getIndividualSearch, setIndividualSearch] = Memo<IndividualSearch | null>(null)

export default function OmniboxEvent() {
  // omnibox 提交
  const [ applyOmniBoxInputEntered, cancelOmniBoxInputEntered ] = ChromeEvent(
    chrome.omnibox.onInputEntered,
    (content) => {
      const ind_search = getIndividualSearch()

      if ((ind_search?.id === content)) {
        const { url_pattern, keyword } = ind_search
        chrome.tabs.create({
          url: toSearchURL(url_pattern, keyword),
          windowId: chrome.windows.WINDOW_ID_CURRENT
        })
      } else {
        chrome.windows.getCurrent(async ({ id }) => {
          if (await controlIsLaunched()) {
            sendMessage('ChangeSearch', content)
          } else {
            launchControlWindow({
              text: content,
              revert_container_id: id
            })
          }
        })
      }
    }
  )

  const loadingAtomic = Atomic()

  // 修改 omnibox 推荐字段
  const [ applyOmniboxSuggest, cancelOmniboxSuggest ] = ChromeEvent(
    chrome.omnibox.onInputChanged,
    (text, suggest) => {
      chrome.omnibox.setDefaultSuggestion({
        // content: 'content',
        description: `Poker搜索: ${text}`,
      })

      loadingAtomic(async () => {
        const [
          is_individual_searching, site, remain_text
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
            const content = text + ' '
            setIndividualSearch({
              id: content,
              keyword: remain_text,
              url_pattern: site_opt.url_pattern
            })
            suggest([{
              // 不加空格的话，显示不出来，可能 chrome 是将 content 作为
              // id 了，就与前面的 setDefaultSuggestion 有冲突了
              content: text + ' ',
              description: `使用${site}搜索: ${remain_text}`,
            }])
          } else {
            suggest([])
            setIndividualSearch(null)
          }
        } else {
          suggest([])
          setIndividualSearch(null)
        }
      })
    }
  )

  return [
    function apply() {
      applyOmniBoxInputEntered()
      applyOmniboxSuggest()
    },
    function cancel() {
      cancelOmniBoxInputEntered()
      cancelOmniboxSuggest()
    }
  ] as const
}
