const trueOrFalse = () => Math.round(Math.random())
const backCode = () => 65 + Math.round(Math.random() * 25)
const randomChar = (lower = 0) => String.fromCharCode(backCode() + (lower && 32))
const randomString = (length: number, lower = 0): string => randomChar(lower && trueOrFalse()) + (--length ? randomString(length, lower) : '');
const randomUrlPattern = () => `http://localhost:2070/${randomString(16, 1)}[[]]&${chrome_id}`

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

  ENVIRMONMENT_STORAGE_KEY: 'poker-env',
  OPTIONS_STORAGE_KEY: 'poker-options',

  PLAIN_WINDOW_URL_PATTERN: chrome.runtime.getURL('/plainWindow.html?q=[[]]'),

  PRESET_SEARCH_LIST: Object.freeze([
    { url_pattern: `https://mobile.twitter.com/search?q=[[]]&src=typeahead_click&${chrome_id}` },
    { url_pattern: `https://www.google.com/search?q=[[]]&${chrome_id}` },
    { url_pattern: `https://pache.blog/tag/[[]]?${chrome_id}` },
    { url_pattern: `https://www.vgtime.com/search/list.jhtml?keyword=[[]]#${chrome_id}` },
    { url_pattern: `https://www.zhihu.com/search?type=content&q=[[]]&${chrome_id}` },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
    { url_pattern: randomUrlPattern() },
  ])
})
export default cfg
