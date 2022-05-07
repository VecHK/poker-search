import { map } from 'ramda'
import { randomString } from '../utils/common'

const randomUrlPattern = () => `http://localhost:2070/${randomString(16, 1)}${cfg.KEYWORD_REPLACEHOLDER}&${chrome_id}`

const { id: chrome_id } = chrome.runtime

const cfg = Object.freeze({
  DEFAULT_TITLE_BAR_HEIGHT: 30,

  INSTALLED_WINDOW_WIDTH: 640,
  INSTALLED_WINDOW_HEIGHT: 480,

  CONTROL_WINDOW_WIDTH: 380,
  CONTROL_WINDOW_HEIGHT: 150,

  SEARCH_WINDOW_WIDTH: 380,
  SEARCH_WINDOW_HEIGHT: 1000,

  SEARCH_WINDOW_GAP_HORIZONTAL: 30,

  SEARCH_FOCUS_INTERVAL: 300,

  ENVIRONMENT_STORAGE_KEY: 'poker-env',
  OPTIONS_STORAGE_KEY: 'poker-options',

  KEYWORD_REPLACEHOLDER: '%poker%',

  MOBILE_PAGE_IDENTIFIER: chrome_id,

  get PLAIN_WINDOW_URL_PATTERN() {
    return chrome.runtime.getURL(`/plainWindow.html?q=${cfg.KEYWORD_REPLACEHOLDER}`)
  },

  get PRESET_SEARCH_LIST() {
    return map(url_pattern => ({ url_pattern }), [
      `https://mobile.twitter.com/search?q=${cfg.KEYWORD_REPLACEHOLDER}&src=typeahead_click&${chrome_id}`,
      `https://www.google.com/search?q=${cfg.KEYWORD_REPLACEHOLDER}&${chrome_id}`,
      `https://pache.blog/tag/${cfg.KEYWORD_REPLACEHOLDER}?${chrome_id}`,
      `https://www.vgtime.com/search/list.jhtml?keyword=${cfg.KEYWORD_REPLACEHOLDER}#${chrome_id}`,
      `https://www.zhihu.com/search?type=content&q=${cfg.KEYWORD_REPLACEHOLDER}&${chrome_id}`,
      `https://www.google.com/maps/search/${cfg.KEYWORD_REPLACEHOLDER}?${chrome_id}`,
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
      randomUrlPattern(),
    ])
  }
})
export default cfg
