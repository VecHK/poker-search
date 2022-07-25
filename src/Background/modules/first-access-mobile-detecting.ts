import { values } from 'ramda'
import cfg from '../../config'
import { getMobileUAHeaderAction } from '../../utils/fake-ua'
const { ResourceType } = chrome.declarativeNetRequest

async function removeAllRules() {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules()

  const removeRuleIds = currentRules.map(rule => rule.id)
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeRuleIds
  })
}

export default async function initFirstAccessMobileDetecting() {
  await removeAllRules()

  return chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: 1,
      priority: 1,
      condition: {
        urlFilter: `${cfg.MOBILE_PAGE_IDENTIFIER}`,
        resourceTypes: values(ResourceType),
      },
      action: getMobileUAHeaderAction(),
    }]
  })
}
