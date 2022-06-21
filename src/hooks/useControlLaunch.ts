import { useEffect } from 'react'
import { cleanControlLaunch } from '../x-state/control-window-launched'

export default function useControlLaunch() {
  useEffect(function cleanControlLaunchBeforeUnload() {
    window.addEventListener('beforeunload', cleanControlLaunch)
    return () => window.removeEventListener('beforeunload', cleanControlLaunch)
  }, [])
}
