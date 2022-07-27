import { always, andThen, inc, map, objOf, pipe, prop, values } from 'ramda'
import { Memo } from 'vait'
import cfg from '../config'
import { TabID } from '../core/layout/window'

const arrayOf = <T>(v: T) => [ v ]

const { ResourceType, RuleActionType } = chrome.declarativeNetRequest

const [ getID, setID ] = Memo(0)
const incrementID = pipe( getID, inc )
const generateID = pipe( incrementID, setID, getID )

export const getMobileUAHeaderAction = always({
  type: RuleActionType['MODIFY_HEADERS'],
  requestHeaders: arrayOf({
    header: 'user-agent',
    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
    value: cfg.MOBILE_USER_AGNET
  })
})

const createTabsRule = (tabIds: TabID[]) => ({
  id: generateID(),
  priority: 1,
  condition: {
    tabIds,
    resourceTypes: values(ResourceType)
  },
  action: getMobileUAHeaderAction()
})
const createTabRules = pipe( (v: TabID) => v, arrayOf, createTabsRule, arrayOf )

export const setFakeUA = pipe(
  createTabRules,
  objOf('addRules'),
  chrome.declarativeNetRequest.updateSessionRules,
)

const mapId = map( prop('id') )
const getSessionRuleIds = pipe(
  chrome.declarativeNetRequest.getSessionRules,
  andThen( mapId ),
)

export const removeAllFakeUARules = pipe(
  getSessionRuleIds,
  andThen(
    pipe(
      objOf('removeRuleIds'),
      chrome.declarativeNetRequest.updateSessionRules
    )
  ),
)
