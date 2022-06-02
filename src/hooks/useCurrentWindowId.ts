import { useEffect, useState } from 'react'

export default function useCurrentWindowId() {
  const [windowId, setWindowId] = useState<null | number>(null)

  useEffect(function setCurrentWindowId() {
    chrome.windows.getCurrent().then(({ id }) => {
      if (id !== undefined) {
        setWindowId(id)
      }
    })
  }, [])

  return windowId
}
