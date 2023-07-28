import cfg from '../../config'
import { Preferences } from '../../preferences'
import { hasStrongMobileAccessMode } from '../../preferences/site-settings'

export function getControlWindowHeight(
  site_settings: Preferences['site_settings']
) {
  if (hasStrongMobileAccessMode(site_settings)) {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_DEBUGGER
  } else {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_NORMAL
  }
}
