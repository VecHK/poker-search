import { useEffect } from 'react'
import { WindowID } from '../core/layout/window'
import { MessageEvent } from '../message'
import { Control } from './useControl'

export default function useReFocusMessage(
  controlWindowId: WindowID | undefined,
  control: Control | null
) {
  useEffect(() => {
    const [ applyRefocusEvent, cancelRefocusEvent ]= MessageEvent('Refocus', () => {
      if ((controlWindowId !== undefined) && (control !== null)) {
        control.cancelAllEvent()
        control.refreshLayout([]).finally(() => {
          control.applyAllEvent()
        })
      } else if (controlWindowId !== undefined) {
        chrome.windows.update(controlWindowId, { focused: true })
      }
    })
    applyRefocusEvent()

    return cancelRefocusEvent
  }, [control, controlWindowId])
}
