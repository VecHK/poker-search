import cfg from '../config'
import { createBase, RevertContainerID } from '../core/base'
import { calcControlWindowPos } from '../core/layout/control-window'
import { ApplyChromeEvent } from '../utils/chrome-event'
import { cleanControlLaunch, controlIsLaunched, setControlLaunch } from '../x-state/control-window-launched'

function detectUrl({ text, revert_container_id }: {
  text?: string
  revert_container_id: RevertContainerID
}): string {
  const usp = new URLSearchParams()
  if (text !== undefined) {
    usp.append(cfg.CONTROL_QUERY_TEXT, text)
  }
  if (revert_container_id !== undefined) {
    usp.append(cfg.CONTROL_QUERY_REVERT, String(revert_container_id))
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
  if (await controlIsLaunched()) {
    throw Error('control window is Launched')
  } else {
    const [ top, left ] = await getControlPos()
    const controlWindow = await chrome.windows.create({
      type: 'popup',
      width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
      height: Math.round(cfg.CONTROL_WINDOW_HEIGHT),
      left: Math.round(left),
      top: Math.round(top),
      url: detectUrl({ text, revert_container_id }),
      focused: true,
    })

    const { id: control_window_id } = controlWindow

    if (control_window_id !== undefined) {
      await setControlLaunch(control_window_id)
    } else {
      throw Error('launchControlWindow: control_window_id is undefined')
    }

    const cancelRemoveEvent = ApplyChromeEvent(
      chrome.windows.onRemoved,
      (id) => {
        if (id === control_window_id) {
          cancelRemoveEvent()
          cleanControlLaunch()
        }
      }
    )

    return {
      controlWindow
    }
  }
}
