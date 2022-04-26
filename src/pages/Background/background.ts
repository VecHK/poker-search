import cfg from "../../config"
import { createBase } from "../../utils/base"

console.log('TypeScriptBackground')

const { ResourceType, RuleActionType } = chrome.declarativeNetRequest

const { id: chrome_id } = chrome.runtime
// const search_entry_url = chrome.runtime.getURL('/search-entry.html')

// chrome.declarativeNetRequest.updateDynamicRules({
//   addRules:[{
//     "id": 4,
//     "priority": 4,
//     "condition": {
//       "regexFilter": "^https:\/\/redirect_search\/test.html(.*)",
//       "resourceTypes": [
//         ResourceType['MAIN_FRAME']
//         // "main_frame"
//       ]
//     },
//     "action": {
//       "type": RuleActionType['REDIRECT'],
//       "redirect": {
//         "regexSubstitution": `${search_entry_url}\\1`
//       }
//     }
//   }]
// })

async function removeAllRules() {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules()

  const removeRuleIds = currentRules.map(rule => rule.id)
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds
  })
}

async function regRules() {
  await removeAllRules()

  return chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: 1,
      priority: 1,
      condition: {
        urlFilter: `${chrome_id}`,
        resourceTypes: [
          ResourceType['OTHER'],
          // ResourceType['WEBBUNDLE'],
          // ResourceType['WEBTRANSPORT'],
          ResourceType['MAIN_FRAME'],
          ResourceType['SUB_FRAME'],
          ResourceType['STYLESHEET'],
          ResourceType['SCRIPT'],
          ResourceType['IMAGE'],
          ResourceType['FONT'],
          ResourceType['OBJECT'],
          ResourceType['XMLHTTPREQUEST'],
          ResourceType['PING'],
          ResourceType['CSP_REPORT'],
          ResourceType['MEDIA'],
          ResourceType['WEBSOCKET']
        ]
      },
      action: {
        type: RuleActionType['MODIFY_HEADERS'],
        requestHeaders: [
          {
            header: "user-agent",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
          }
        ]
      }
    }]
  })
}

regRules()

chrome.omnibox.onInputEntered.addListener((text) => {
  // text
  console.log('text', text)
  createBase(false).then(base => {
    const [top, left] = base.getControlWindowPos(base.total_line)
    chrome.windows.create({
      type: 'popup',
      width: cfg.CONTROL_WINDOW_WIDTH,
      height: cfg.CONTROL_WINDOW_HEIGHT,
      left,
      top,
      url: chrome.runtime.getURL(`/control.html?q=${encodeURIComponent(text)}`)
    })
  })
})

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  chrome.omnibox.setDefaultSuggestion({
    // content: 'content',
    description: `Poker搜索: ${text}`,
  })

  suggest([{
    content: 'content',
    description: "description",
  }])
})
