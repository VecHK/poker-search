import { useEffect } from 'react'
import { WindowID } from '../core/layout/window'
import { ApplyChromeEvent } from '../utils/chrome-event'
import { Control } from './useControl'

export default function useFocusLayoutShortcut(
  controlWindowId: WindowID | undefined,
  control: Control | null
) {
  useEffect(function handleShortcutKey() {
    return ApplyChromeEvent(
      chrome.commands.onCommand,
      (command: string) => {
        if (command === 'focus-layout') {
          if ((controlWindowId !== undefined) && (control !== null)) {
            control.cancelAllEvent()
            control.refreshLayout([]).finally(() => {
              control.applyAllEvent()
            })
          } else if (controlWindowId !== undefined) {
            chrome.windows.update(controlWindowId, { focused: true })
          }
        }
      }
    )
  }, [controlWindowId, control])
}
