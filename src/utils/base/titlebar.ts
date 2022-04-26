import cfg, { getTitleBarHeight, setTitleBarHeight } from "../../config"

function detectTitleBarHeight() {
  return cfg.CONTROL_WINDOW_HEIGHT - window.innerHeight
}

export function processTitleBarHeight(detectTitleBar: boolean) {
  if (detectTitleBar) {
    const titleBarHeight = detectTitleBarHeight()
    setTitleBarHeight(detectTitleBarHeight())
    return titleBarHeight
  } else {
    return getTitleBarHeight()
  }
}
