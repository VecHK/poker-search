import { thunkify } from 'ramda'
import cfg from '../../config'
import { createBase, getFilteredSiteSettingsBySearchText, initLayoutInfo, RevertContainerID } from '../../core/base'
import { Preferences } from '../../preferences'
import { hasStrongMobileAccessMode } from '../../preferences/site-settings'
import { getControlWindowHeight } from '../base/control-window-height'
import { controlIsLaunched } from '../control-window'
import { calcControlWindowPos } from '../layout/control-window'
import { Environment } from '../../environment'
import { Limit } from '../base/limit'

export function getControlBounds(
  environment: Environment,
  limit: Limit,
  site_settings: Preferences['site_settings']
) {
  const control_window_height = getControlWindowHeight(
    hasStrongMobileAccessMode(site_settings)
  )

  const layout_info = initLayoutInfo(environment, limit, site_settings)

  const [ top, left ] = calcControlWindowPos(
    control_window_height,
    layout_info.total_height,
    limit
  )

  return {
    top,
    left,
    width: cfg.CONTROL_WINDOW_WIDTH,
    height: control_window_height,
  } as const
}

async function calcControlBounds(search_keyword: string) {
  const base = await createBase(undefined)
  return getControlBounds(
    base.environment,
    base.limit,
    getFilteredSiteSettingsBySearchText(
      search_keyword,
      base.preferences.site_settings,
      base.init_filtered_floor
    )
  )
}

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

export default async function launchControlWindow({ text, revert_container_id }: {
  text: string | undefined
  revert_container_id: RevertContainerID
}) {
  if (await controlIsLaunched()) {
    throw Error('control window is Launched')
  } else {
    const { top, left, height, width } = await calcControlBounds(text || '')

    const controlWindow = await chrome.windows.create({
      url: generateUrl({ text, revert_container_id }),
      type: 'popup',
      state: 'normal',
      focused: true,

      width: Math.round(width),
      height: Math.round(height),
      left: Math.round(left),
      top: Math.round(top),
    })

    const { id: control_window_id, state } = controlWindow

    if (control_window_id === undefined) {
      throw Error('launchControlWindow: control_window_id is undefined')
    } else {
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
