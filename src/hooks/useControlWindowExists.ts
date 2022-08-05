import { useEffect, useState } from 'react'
import { getControlWindowID } from '../core/control-window'
import { WindowID } from '../core/layout/window'
import { ApplyChromeEvent } from '../utils/chrome-event'

export default function useControlWindowExists(): boolean {
  const [window_id, setWindowId] = useState<WindowID>()

  useEffect(() => {
    getControlWindowID().then(win_id => {
      setWindowId(win_id)
    })
  }, [])

  useEffect(() => {
    return ApplyChromeEvent(chrome.windows.onCreated, (win) => {
      getControlWindowID()
        .then((win_id) => {
          setWindowId(win_id)
        })
    })
  }, [])

  useEffect(() => {
    if (window_id !== undefined) {
      return ApplyChromeEvent(chrome.windows.onRemoved, win_id => {
        if (window_id === win_id) {
          setWindowId(undefined)
        }
      })
    }
  }, [window_id])

  return Boolean(window_id)
}
