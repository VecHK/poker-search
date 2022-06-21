import { useEffect, useState } from 'react'

export default function useCurrentWindow() {
  const [win, setWin] = useState<{
    windowId: number
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
