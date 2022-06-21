import { useEffect } from 'react'
import { Preferences } from '../preferences'
import { presetLaunchContextMenu, removeLaunchContextMenu } from '../Background/launch-contextmenu'

export default function useLaunchContextMenu(preferences: Preferences) {
  useEffect(() => {
    if (preferences.launch_poker_contextmenu) {
      removeLaunchContextMenu()
    }
  }, [preferences.launch_poker_contextmenu])

  useEffect(function presetLaunchContextMenuBeforeExit() {
    if (preferences.launch_poker_contextmenu) {
      window.addEventListener('beforeunload', presetLaunchContextMenu)
      return () => window.removeEventListener('beforeunload', presetLaunchContextMenu)
    }
  }, [preferences.launch_poker_contextmenu])
}
