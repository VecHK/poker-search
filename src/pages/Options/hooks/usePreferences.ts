import { curry } from 'ramda'
import { useCallback, useEffect, useState } from 'react'

import { Preferences, save as savePreferences } from '../../../preferences'
import { controlIsLaunched } from '../../../x-state/control-window-launched'
import { sendMessage } from '../../../message'

type SafelyPreferencesKeys = Exclude<keyof Preferences, '__is_poker__' | 'version'>

const RequireCloseControlWindow = <A extends unknown[]>(
  callback: (...args: A) => void
) => (
  async (...args: A) => {
    if (await controlIsLaunched()) {
      alert('修改这个设置项需要先关闭 Poker 控制窗')
      sendMessage('Refocus', null)
    } else {
      return callback(...args)
    }
  }
)

export default function usePreferences({ autoSave, onSaved }: {
  autoSave?: boolean
  onSaved?(): void
}) {
  const [preferences, setPreferences] = useState<Preferences | undefined>(undefined)

  const updatePreferencesField = curry(
    useCallback(function <F extends SafelyPreferencesKeys>(
      field: F,
      getNewPreferences: Preferences[F] | ((p: Preferences) => Preferences[F]),
    ) {
      setPreferences((latest) => {
        if (latest === undefined) {
          return undefined
        } else {
          if (typeof getNewPreferences === 'function') {
            return {
              ...latest,
              [field]: getNewPreferences(latest)
            }
          } else {
            return {
              ...latest,
              [field]: getNewPreferences
            }
          }
        }
      })
    }, [])
  )

  const HandleSettingFieldChange = useCallback((f: SafelyPreferencesKeys) => {
    return RequireCloseControlWindow(updatePreferencesField(f))
  }, [updatePreferencesField])

  useEffect(() => {
    if (autoSave) {
      if (preferences !== undefined) {
        savePreferences(preferences).then(() => {
          onSaved && onSaved()
        })
      }
    }
  }, [autoSave, onSaved, preferences])

  return { preferences, setPreferences, HandleSettingFieldChange, updatePreferencesField }
}
