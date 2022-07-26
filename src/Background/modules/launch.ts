import { thunkify } from 'ramda'
import cfg from '../../config'
import { createBase, createLayoutInfo, RevertContainerID, selectSiteSettingsByFiltered } from '../../core/base'
import { getControlWindowHeight } from '../../core/base/control-window-height'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { controlIsLaunched, setControlLaunch } from '../../x-state/control-window-launched'

export const getControlWindowUrl = thunkify(chrome.runtime.getURL)(
  `/control.html`
)

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
    return `${getControlWindowUrl()}?${param_string}`
  } else {
    return getControlWindowUrl()
  }
}

async function getControlPos() {
  const base = await createBase(undefined)
  const info = createLayoutInfo(base.environment, base.limit, base.preferences.site_settings)

  const site_settings = selectSiteSettingsByFiltered(
    base.preferences.site_settings,
    base.init_filtered_floor
  )

  const [ top, left ] = calcControlWindowPos(
    getControlWindowHeight(site_settings),
    info.total_height,
    base.limit
  )
  return [ top, left ] as const
}

export default async function launchControlWindow({ text, revert_container_id }: {
  text: string | undefined
  revert_container_id: RevertContainerID
}) {
  const base_P = createBase(undefined)
  const control_is_launched_P = controlIsLaunched()
  if (await control_is_launched_P) {
    throw Error('control window is Launched')
  } else {
    const site_settings = selectSiteSettingsByFiltered(
      (await base_P).preferences.site_settings,
      (await base_P).init_filtered_floor
    )
    const control_window_height = getControlWindowHeight(site_settings)
    const [ top, left ] = await getControlPos()
    const controlWindow = await chrome.windows.create({
      url: generateUrl({ text, revert_container_id }),
      type: 'popup',
      state: 'normal',
      focused: true,

      width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
      height: Math.round(control_window_height),
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
