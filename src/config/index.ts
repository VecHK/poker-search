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

let TITLE_BAR_HEIGHT = 30
export const setTitleBarHeight = (h: number) => { TITLE_BAR_HEIGHT = h }
export const getTitleBarHeight = () => TITLE_BAR_HEIGHT
