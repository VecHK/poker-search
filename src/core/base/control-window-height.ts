import cfg from '../../config'
import { Preferences } from '../../preferences'

export const hasStrongMobileAccessMode = (
  site_settings: Preferences['site_settings']
) => (
  site_settings.some(
    (settings) => settings.row.some(
      opt => opt.access_mode === 'MOBILE-STRONG'
    )
  )
)

export function getControlWindowHeight(
  site_settings: Preferences['site_settings']
) {
  if (hasStrongMobileAccessMode(site_settings)) {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_DEBUGGER
  } else {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_NORMAL
  }
}
