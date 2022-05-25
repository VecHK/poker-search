import cfg from '../config'
import { createBase, RevertContainerID } from '../core/base'
import { calcControlWindowPos } from '../core/layout/control-window'

function detectUrl({ text, revert_container_id }: {
  text?: string
  revert_container_id: RevertContainerID
}): string {
  const usp = new URLSearchParams()
  if (text !== undefined) {
    usp.append('q', text)
  }
  if (revert_container_id !== undefined) {
    usp.append('revert', String(revert_container_id))
  }

  const param_string = usp.toString()
  if (param_string.length !== 0) {
    return chrome.runtime.getURL(`/control.html?${param_string}`)
  } else {
    return chrome.runtime.getURL(`/control.html`)
  }
}

async function getControlPos() {
  const base = await createBase(undefined)

  const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
  return [ top, left ] as const
}

export default async function launchControlWindow({ text, revert_container_id }: {
  text: string | undefined
  revert_container_id: RevertContainerID
}) {
  const [ top, left ] = await getControlPos()
  const controlWindow = await chrome.windows.create({
    type: 'popup',
    width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
    height: Math.round(cfg.CONTROL_WINDOW_HEIGHT),
    left: Math.round(left),
    top: Math.round(top),
    url: detectUrl({ text, revert_container_id })
  })

  return {
    controlWindow
  }
}
