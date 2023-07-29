import { equals } from 'ramda'
import { WindowID } from '../layout/window'
import { Environment } from '../../environment'
import { Limit } from '../base/limit'
import { Preferences } from '../../preferences'
import { getControlBounds } from './launch'
import animatingWindow from '../../utils/animating-window'

export async function resizeControlWindow({
  control_win_id,
  environment,
  limit,
  site_settings,
}: {
  control_win_id: WindowID,
  environment: Environment,
  limit: Limit,
  site_settings: Preferences['site_settings']
}) {
  const { top, left, height } = getControlBounds(
    environment,
    limit,
    site_settings
  )

  const win = await chrome.windows.get(control_win_id)

  const not_move = equals(
    [win.top, win.left, win.height],
    [top, left, height]
  )

  if (!not_move) {
    await animatingWindow(control_win_id, 382, {
      top: win.top,
      left: win.left,
      height: win.height,
    }, {
      top,
      left,
      height,
    })
  }
}
