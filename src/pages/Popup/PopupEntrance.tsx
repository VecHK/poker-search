import React, { useEffect } from 'react'
import useControlWindowExists from '../../hooks/useControlWindowExists'
import { sendMessage } from '../../message'

import Popup from './Popup'

export default function PopupEntrance() {
  const control_window_exists = useControlWindowExists()
  useEffect(function exitCurrentAppWhenControlWindowLaunched() {
    if (control_window_exists) {
      sendMessage('Refocus', null).finally(() => {
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
