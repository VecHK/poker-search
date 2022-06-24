import cfg from '../../config'
const { ResourceType, RuleActionType } = chrome.declarativeNetRequest

async function removeAllRules() {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules()

  const removeRuleIds = currentRules.map(rule => rule.id)
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds
  })
}

export async function regRules() {
  await removeAllRules()

  return chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: 1,
      priority: 1,
      condition: {
        urlFilter: `${cfg.MOBILE_PAGE_IDENTIFIER}`,
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
