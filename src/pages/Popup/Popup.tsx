import { reverse } from 'ramda'
import React, { useEffect, useState } from 'react'

import { AlarmSetTimeout } from '../../utils/chrome-alarms'
import { getCurrentDisplayLimit, Limit } from '../../core/base/limit'

import { load as loadPreferences, SiteSettings, SiteOption } from '../../preferences'
import { generateSiteSettingsRow } from '../../preferences/site-settings'

import usePreferences from '../Options/hooks/usePreferences'
import useMaxWindowPerLine from '../../hooks/useMaxWindowPerLine'

import { SwitchState } from './ActionSwitch'
import PopupMain from './PopupMain'
import PopupBackground from './PopupBackground'

import './Popup.css'

export default function PopupPage () {
  const [ switchState, setSwitchState ] = useState<SwitchState>('NORMAL')

  const { preferences, setPreferences, setPreferencesItem } = usePreferences({
    autoSave: true,
  })
  const [limit, setLimit] = useState<Limit>()

  const maxWindowPerLine = useMaxWindowPerLine(limit)

  useEffect(() => {
    getCurrentDisplayLimit()
      .then(setLimit)
  }, [])

  useEffect(() => {
    loadPreferences()
      .then(setPreferences)
  }, [setPreferences])

  useEffect(() => {
    if (switchState === 'SAVED') {
      const cancel = AlarmSetTimeout(1500, () => {
        setSwitchState('NORMAL')
      })

      return () => { cancel() }
    }
  }, [switchState])

  return (
    <div className="Popup">
      <PopupMain isOpenBackground={switchState === 'BACKGROUND'} />
      <PopupBackground
        switchState={switchState}
        onClickAddToPoker={() => {
          setSwitchState('BACKGROUND')
        }}
        onSave={(opt) => {
          console.log('onSave', preferences)
          if (preferences) {
            setPreferencesItem('site_settings')((latest) => {
              setSwitchState('SAVED')
              return addToSiteSettings(opt, latest.site_settings, maxWindowPerLine)
            })
          }
        }}
        onClickCancel={() => setSwitchState('NORMAL')}
      />
    </div>
  )
}

function addToSiteSettings(
  new_site_option: SiteOption,
  site_settings: SiteSettings,
  maxWindowPerLine: number
): SiteSettings {
  if (site_settings.length === 0) {
    throw Error('site_settings.length is 0')
  } else {
    const [ first_settings, ...remain_settings ] = reverse(site_settings)
    const total_column = first_settings.row.length
    if (total_column >= maxWindowPerLine) {
      // 已满，另开新行
      return reverse([
        generateSiteSettingsRow([ new_site_option ]),
        first_settings,
        ...remain_settings
      ])
    } else {
      return reverse([
        {
          ...first_settings,
          row: [new_site_option, ...first_settings.row]
        },
        ...remain_settings
      ])
    }
  }
}
