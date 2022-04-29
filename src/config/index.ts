const CONTROL_WINDOW_WIDTH = 380
const CONTROL_WINDOW_HEIGHT = 150
const cfg = Object.freeze({
  CONTROL_WINDOW_WIDTH,
  CONTROL_WINDOW_HEIGHT,

  SEARCH_WINDOW_WIDTH: 380,
  SEARCH_WINDOW_HEIGHT: 1000,
  get SEARCH_WINDOW_GAP_HORIZONTAL(){
    return getTitleBarHeight()
  }
})
export default cfg

let DEFAULT_TITLE_BAR_HEIGHT = 30
export const setTitleBarHeight = (h: number) => {
  return chrome.storage.sync.set({ TITLE_BAR_HEIGHT: h })
}
export const getTitleBarHeight = async (): Promise<number> => {
  const result = await chrome.storage.sync.get(['TITLE_BAR_HEIGHT'])
  const { TITLE_BAR_HEIGHT } = result
  if (TITLE_BAR_HEIGHT !== undefined) {
    return Number(TITLE_BAR_HEIGHT as number)
  } else {
    await setTitleBarHeight(DEFAULT_TITLE_BAR_HEIGHT)
    return getTitleBarHeight()
  }
  // console.log('Value currently is ' + result.key);
}

// chrome.storage.sync.set({key: value}, function() {
//   console.log('Value is set to ' + value);
// });
