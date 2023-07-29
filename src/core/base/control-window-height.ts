import cfg from '../../config'

export function getControlWindowHeight(has_strong_mobile_mode: boolean) {
  if (has_strong_mobile_mode) {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_DEBUGGER
  } else {
    return cfg.CONTROL_WINDOW_HEIGHT_WITH_NORMAL
  }
}
