const { id: chrome_id } = chrome.runtime

const KEYWORD_REPLACEHOLDER = '%poker%'
const KEYWORD_REPLACEHOLDER_WITH_BASE64 = '|poker|'

const cfg = Object.freeze({
  DEBUG_DEV_TOOLS_WIDTH: 640,

  DEFAULT_TITLE_BAR_HEIGHT: 30,

  INSTALLED_WINDOW_WIDTH: 640,
  INSTALLED_WINDOW_HEIGHT: 480,

  CONTROL_WINDOW_WIDTH: 380,

  CONTROL_WINDOW_HEIGHT_WITH_NORMAL: 220,
  CONTROL_WINDOW_HEIGHT_WITH_DEBUGGER: 220 + 42,

  CONTROL_QUERY_TEXT: 'text',
  CONTROL_QUERY_REVERT: 'revert',

  SEARCH_WINDOW_WIDTH_SMALL: 320,
  SEARCH_WINDOW_WIDTH_NORMAL: 380,
  NORMAL_WINDOW_WINDOW_COUNT: 5,

  REFOCUS_LAYOUT_WINDOW_WIDTH: 128,
  REFOCUS_LAYOUT_WINDOW_HEIGHT: 80,

  SEARCH_WINDOW_HEIGHT_LIST: [
    1500,
    1000,
    720,
    480,
    320,
    200
  ],

  SEARCH_WINDOW_GAP_HORIZONTAL: 30,

  SEARCH_FOCUS_INTERVAL: 300,
  WINDOWS_DOUBLE_FOCUS_WAITING_DURATION: 100,

  ENVIRONMENT_STORAGE_KEY: 'poker-env',
  PREFERENCES_STORAGE_KEY: 'poker-options',

  KEYWORD_REPLACEHOLDER,
  KEYWORD_REPLACEHOLDER_WITH_BASE64,

  MOBILE_PAGE_IDENTIFIER: chrome_id,

  get PLAIN_SEARCH_WINDOW_URL_PATTERN() {
    return chrome.runtime.getURL(`/plainWindow.html?q=${KEYWORD_REPLACEHOLDER}`)
  },

  get DEFAULT_SITE_ICON() {
    return chrome.runtime.getURL(`/default-siteicon.png`)
  },

  EXPORT_SITE_SETTINGS_FILE_NAME: 'poker-sites.json',
  DEFAULT_SITE_SETTING_FLOOR_NAME: '',

  MOBILE_USER_AGNET: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
} as const)
export default cfg
