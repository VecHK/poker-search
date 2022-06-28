import { useEffect } from 'react'
import { WindowID } from '../core/layout/window'
import { ApplyChromeEvent } from '../utils/chrome-event'

export default function usePreventEnterFullScreen(window_id: WindowID | undefined) {
  useEffect(() => {
    return ApplyChromeEvent(
      chrome.windows.onBoundsChanged,
      (win) => {
        if (window_id !== undefined) {
          if (win.id === window_id) {
            if (win.state === 'fullscreen') {
              chrome.windows.update(window_id, { focused: true, state: 'normal' })
            }
          }
        }
      }
    )
  })
}
