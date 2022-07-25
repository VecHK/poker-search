import { always, andThen, inc, map, objOf, pipe, prop, values } from 'ramda'
import { Memo } from 'vait'
import { TabID } from './window'

const { ResourceType, RuleActionType } = chrome.declarativeNetRequest

const MOBILE_USER_AGNET = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'

const [ getID, setID ] = Memo(0)
const incrementID = pipe(
  getID,
  inc,
  setID,
  getID,
)

const getDNRAction = always({
  type: RuleActionType['MODIFY_HEADERS'],
  requestHeaders: [
    {
      header: "user-agent",
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: MOBILE_USER_AGNET
    }
  ]
})

const getRule = (tabIds: TabID[]) => ({
  id: incrementID(),
  priority: 1,
  condition: {
    tabIds,
    resourceTypes: values(ResourceType)
  },
  action: getDNRAction()
})

const getSessionRuleIds = pipe(
  chrome.declarativeNetRequest.getSessionRules,
  andThen(
    map( prop('id') )
  ),
)

export async function setFakeUA(
  tabId: TabID
) {
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [ getRule([ tabId ]) ]
  })
}

export const removeAllFakeUARules = pipe(
  getSessionRuleIds,
  andThen(
    pipe(
      objOf('removeRuleIds'),
      chrome.declarativeNetRequest.updateSessionRules
    )
  )
)
