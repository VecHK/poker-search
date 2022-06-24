import cfg from '../../config'
import { createBase, RevertContainerID } from '../../core/base'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { controlIsLaunched, setControlLaunch } from '../../x-state/control-window-launched'

function generateUrl({ text, revert_container_id }: {
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
      url: generateUrl({ text, revert_container_id }),
      type: 'popup',
      state: 'normal',
      focused: true,

      width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
      height: Math.round(cfg.CONTROL_WINDOW_HEIGHT),
      left: Math.round(left),
      top: Math.round(top),
    })

    const { id: control_window_id, state } = controlWindow

    if (control_window_id === undefined) {
      throw Error('launchControlWindow: control_window_id is undefined')
    } else {
      await setControlLaunch(control_window_id)

      if (state === 'fullscreen') {
        // prevent fullscreen
        await chrome.windows.update(control_window_id, { focused: true, state: 'normal' })
      }

      return {
        controlWindow
      }
    }
  }
}
