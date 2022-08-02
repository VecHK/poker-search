import React, { useEffect } from 'react'
import { focusControlWindow } from '../../core/control-window'
import useControlWindowExists from '../../hooks/useControlWindowExists'

import Popup from './Popup'

export default function PopupEntrance() {
  const control_window_exists = useControlWindowExists()
  useEffect(function exitCurrentAppWhenControlWindowLaunched() {
    if (control_window_exists) {
      focusControlWindow().finally(() => {
        window.close()
      })
    }
  }, [control_window_exists])

  if (control_window_exists) {
    return <></>
  } else {
    return <Popup />
  }
}
