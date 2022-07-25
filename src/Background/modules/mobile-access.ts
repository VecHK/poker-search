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
            value: cfg.MOBILE_USER_AGNET,
          }
        ]
      }
    }]
  })
}
