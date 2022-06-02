import { useEffect, useState } from 'react'

export default function useWindowFocus(initFocusValue: boolean) {
  const [ focus, setFocus ] = useState(initFocusValue)

  useEffect(() => {
    const focusHandler = () => setFocus(true)
    const blurHandler = () => setFocus(false)
    window.addEventListener('focus', focusHandler)
    window.addEventListener('blur', blurHandler)
    return () => {
      window.removeEventListener('focus', focusHandler)
      window.removeEventListener('blur', blurHandler)
    }
  }, [])

  return focus
}
