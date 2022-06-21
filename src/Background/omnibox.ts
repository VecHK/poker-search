import { sendMessage } from '../message'
import { ChromeEvent } from '../utils/chrome-event'
import { controlIsLaunched } from '../x-state/control-window-launched'
import launchControlWindow from './launch'

export default function OmniboxEvent() {
  // omnibox 提交
  const [ applyOmniBoxInputEntered, cancelOmniBoxInputEntered ] = ChromeEvent(
    chrome.omnibox.onInputEntered,
    (text) => {
      chrome.windows.getCurrent(async ({ id }) => {
        if (await controlIsLaunched()) {
          sendMessage('ChangeSearch', text)
        } else {
          launchControlWindow({
            text,
            revert_container_id: id
          })
        }
      })
    }
  )

  // 修改 omnibox 推荐字段
  const [ applyOmniboxSuggest, cancelOmniboxSuggest ] = ChromeEvent(
    chrome.omnibox.onInputChanged,
    (text, suggest) => {
      chrome.omnibox.setDefaultSuggestion({
        // content: 'content',
        description: `Poker搜索: ${text}`,
      })

      // suggest([{
      //   content: 'content',
      //   description: "description",
      // }])
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
