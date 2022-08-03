import React, { useEffect } from 'react'
import { focusControlWindow } from '../../core/control-window'
import useControlWindowExists from '../../hooks/useControlWindowExists'
import useWindowFocus from '../../hooks/useWindowFocus'

import Popup from './Popup'

export default function PopupEntrance() {
  const control_is_launched = useControlWindowExists()
  useEffect(function exitPopupWhenControlWindowLaunch() {
    if (control_is_launched) {
      focusControlWindow().finally(() => {
        window.close()
      })
    }
  }, [control_is_launched])

  const window_focused = useWindowFocus(true)
  useEffect(function exitPopupWhenWindowBlur() {
    if (!window_focused) {
      focusControlWindow().finally(() => {
        window.close()
      })
    }
  }, [window_focused])

  if (control_is_launched) {
    return <></>
  } else {
    return <Popup />
  }
}
