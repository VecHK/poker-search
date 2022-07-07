import { reverse } from 'ramda'
import React, { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react'

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
import { accessModeTipText } from '../Options/Component/SiteSettingsManager/AccessModeSetting'

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

  const [currentFloor, setFloor] = useState(0)

  return (
    <div className="Popup">
      <FloorLayout
        current={currentFloor}
        floors={[
          {
            height: 'var(--main-height)',
            node: <PopupMain isOpenBackground={switchState === 'BACKGROUND'} />,
          },
          {
            height: 'var(--popup-height)',
            node: (
              <PopupBackground
                switchState={switchState}
                onClickAddToPoker={() => {
                  setSwitchState('BACKGROUND')
                  setFloor(1)
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
                onClickCancel={() => {
                  setSwitchState('NORMAL')
                  setFloor(0)
                }}
                onClickForceMobileAccessTipsCircle={() => {
                  setFloor(2)
                }}
              />
            )
          },
          {
            height: 'var(--popup-height)',
            node: (
              <article>{accessModeTipText}</article>
            )
          }
        ]}
      />
    </div>
  )
}

type FloorHeight = Exclude<CSSProperties['height'], undefined>
type Floor = {
  height: FloorHeight
  node: ReactNode
}
function FloorLayout({ floors, current }: { floors: Floor[]; current: number }) {
  const currentTop = useMemo(() => {
    if (floors.length === 0) {
      throw Error('floors.length is 0')
    }
    else if (current === 0) {
      return '0px'
    }

    const previousFloors = floors.filter((_, floorNumber) => {
      return floorNumber < current
    })

    const previousFloorsHeight = previousFloors.map(f => f.height)

    return `calc(-1 * (${previousFloorsHeight.join(' + ')}))`
  }, [current, floors])

  console.log('currentTop', currentTop)

  return (
    <div className="FloorLayout">
      <div className="FloorLayoutInner" style={{ top: currentTop }}>
        {
          floors.map((floor, idx) => {
            return (
              <div key={idx} className='Floor' style={{ height: floor.height }}>
                {floor.node}
              </div>
            )
          })
        }
      </div>
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
    const [ upper_settings, ...remain_settings ] = reverse(site_settings)
    const total_column = upper_settings.row.length
    if (total_column >= maxWindowPerLine) {
      // 不够放了，就多创个 site setting
      return reverse([
        generateSiteSettingsRow([ new_site_option ]),
        upper_settings,
        ...remain_settings
      ])
    } else {
      return reverse([
        {
          ...upper_settings,
          row: [new_site_option, ...upper_settings.row]
        },
        ...remain_settings
      ])
    }
  }
}
