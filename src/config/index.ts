import { randomString } from '../utils/common'

const randomUrlPattern = () => `http://localhost:2070/${randomString(16, 1)}${cfg.KEYWORD_REPLACEHOLDER}`

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

  get PLAIN_SEARCH_WINDOW_URL_PATTERN() {
    return chrome.runtime.getURL(`/plainWindow.html?q=${cfg.KEYWORD_REPLACEHOLDER}`)
  },

  // DEFAULT_SITE_ICON: 'https://pache.blog/test_pics/7.jpg',
  get DEFAULT_SITE_ICON() {
    return chrome.runtime.getURL(`/default-siteicon.png`)
  },
  DEFAULT_ENABLE_MOBILE: true,
  DEFAULT_MAX_WINDOW_PER_LINE: 8,
  get DEFAULT_SEARCH_LIST() {
    return [
      `https://mobile.twitter.com/search?q=${cfg.KEYWORD_REPLACEHOLDER}&src=typeahead_click`,
      `https://www.google.com/search?q=${cfg.KEYWORD_REPLACEHOLDER}`,
      `https://pache.blog/tag/${cfg.KEYWORD_REPLACEHOLDER}`,
      `https://www.vgtime.com/search/list.jhtml?keyword=${cfg.KEYWORD_REPLACEHOLDER}`,
      `https://www.zhihu.com/search?type=content&q=${cfg.KEYWORD_REPLACEHOLDER}`,
      `https://www.google.com/maps/search/${cfg.KEYWORD_REPLACEHOLDER}`,
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
    ]
  }
})
export default cfg
