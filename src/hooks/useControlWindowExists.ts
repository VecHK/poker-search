import { nth } from 'ramda'
import { useEffect, useState } from 'react'
import { getControlWindowUrl } from '../Background/modules/launch'
import { WindowID } from '../core/layout/window'
import { ApplyChromeEvent } from '../utils/chrome-event'

async function getControlWindowId(): Promise<WindowID | undefined> {
  const tab = nth(
    0,
    await chrome.tabs.query({
      url: getControlWindowUrl(),
      windowType: 'popup'
    })
  )
  return tab?.windowId
}

export async function controlIsLaunched() {
  const control_window_id = await getControlWindowId()
  return control_window_id !== undefined
}

export default function useControlWindowExists(): boolean {
  const [window_id, setWindowId] = useState<WindowID>()

  useEffect(() => {
    getControlWindowId().then(win_id => {
      setWindowId(win_id)
    })
  }, [])

  useEffect(() => {
    return ApplyChromeEvent(chrome.windows.onCreated, (win) => {
      getControlWindowId()
        .then((win_id) => {
          setWindowId(win_id)
        })
    })
  }, [])

  useEffect(() => {
    if (window_id !== null) {
      return ApplyChromeEvent(chrome.windows.onRemoved, win_id => {
        if (window_id === win_id) {
          setWindowId(undefined)
        }
      })
    }
  }, [window_id])

  return Boolean(window_id)
}
