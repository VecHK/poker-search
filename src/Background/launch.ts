import cfg from '../config'
import { createBase } from '../core/base'
import { calcControlWindowPos } from '../core/layout/control-window'

function detectUrl(text?: string) {
  if (text === undefined) {
    return chrome.runtime.getURL(`/control.html`)
  } else {
    return chrome.runtime.getURL(`/control.html?q=${encodeURIComponent(text)}`)
  }
}

export default async function launchPoker(text?: string) {
  const base = await createBase()

  const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
  const controlWindow = await chrome.windows.create({
    type: 'popup',
    width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
    height: Math.round(cfg.CONTROL_WINDOW_HEIGHT),
    left: Math.round(left),
    top: Math.round(top),
    url: detectUrl(text)
  })

  return {
    base,
    controlWindow
  }
}
