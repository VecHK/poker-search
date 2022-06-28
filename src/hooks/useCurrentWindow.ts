import { useEffect, useState } from 'react'
import { WindowID } from '../core/layout/window'

export default function useCurrentWindow() {
  const [win, setWin] = useState<{
    windowId: WindowID
    incognito: boolean
  } | undefined>(undefined)

  useEffect(function setCurrentWindow() {
    chrome.windows.getCurrent().then(({ id, incognito }) => {
      if (id === undefined) {
        throw Error('setCurrentWindow: id === undefined')
      } else {
        setWin({
          windowId: id,
          incognito,
        })
      }
    })
  }, [])

  return win
}
