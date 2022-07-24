import React, { createContext, useCallback, useEffect, useState } from 'react'
import { findIndex, map, nth, propEq, reverse, update } from 'ramda'

import cfg from '../../../../config'
import {
  SiteSettings,
  SiteSettingFloorID,
  SiteSettingFloor,
  SiteOption,
  generateSiteSettingFloor,
  toMatrix
} from '../../../../preferences/site-settings'

import { Limit } from '../../../../core/base/limit'
import { autoAdjustWidth } from '../../../../core/base/auto-adjust'

import DragFloors, { FLOOR_TRANSITION_DURATION } from './DragFloors'

import s from './index.module.css'

export type Edit = SiteOption['id'] | null

const constructContextValue = (append: {
  siteSettings: SiteSettings
  adjustWidth: (t: number) => void
  limit: Limit,
  edit: Edit
  setEdit: React.Dispatch<React.SetStateAction<Edit>>
  appendSiteOption(settingsFloorId: SiteSettingFloorID, siteOption: SiteOption): void
  updateFloor: (id: SiteSettingFloorID, newFloor: SiteSettingFloor) => void
  updateOne: (id: SiteOption['id'], opt: SiteOption) => void
  submitChange: (settings: SiteSettings) => void
}) => ({ ...append })

export const ManagerContext = createContext(constructContextValue({
  limit: {} as Limit,
  adjustWidth: () => {},
  siteSettings: [],
  edit: null,
  setEdit: () => {},
  appendSiteOption: () => {},
  updateFloor: () => {},
  updateOne: () => {},
  submitChange: () => {},
}))

function clearEmptyFloor(real_setting_floors: SiteSettings) {
  return real_setting_floors.filter(f => f.row.length)
}

function calcMaxColumn(setting_floors: SiteSettings) {
  return toMatrix(setting_floors).reduce((p, c) => Math.max(p, c.length), 0)
}

function hasEmptyFloor(setting_floors: SiteSettings) {
  return !setting_floors.every(f => f.row.length)
}

function needAdjustWidth({
  oldSettings,
  newSettings,
  isAddNewFloor,
  limit,
}: {
  oldSettings: SiteSettings
  newSettings: SiteSettings
  isAddNewFloor: boolean
  limit: Limit
}): number | false {
  const { max_window_per_line } = autoAdjustWidth(
    cfg.SEARCH_WINDOW_GAP_HORIZONTAL,
    limit.width,
  )

  const newCol = calcMaxColumn(newSettings)
  const oldCol = calcMaxColumn(oldSettings)
  const colDiff = newCol !== oldCol

  const isShowOrHideAddIcon = (colDiff &&
    (newCol === max_window_per_line)) ||
    (oldCol === max_window_per_line)

  const isBig =
    (newCol > max_window_per_line) ||
    (oldCol > max_window_per_line)

  if (!isShowOrHideAddIcon || isBig) {
    if (hasEmptyFloor(newSettings) || isAddNewFloor) {
      return 1000
    } else {
      return 500
    }
  } else {
    return false
  }
}

export default function SiteSettingsManager({
  siteSettings: outter_settings,
  limit,
  adjustWidth,
  onChangeOne,
  onChange: emitChange,
  readonly = false,
  onPreventChange,
}: {
  readonly?: boolean
  onPreventChange: () => void
  siteSettings: SiteSettings
  limit: Limit
  adjustWidth: (t: number) => void
  onChangeOne: (id: SiteOption['id'], opt: SiteOption) => void
  onChange: (settings: SiteSettings) => void
}) {
  const [edit, setEdit] = useState<Edit>(null)

  const [inner_settings, setInnerSettings] = useState([
    ...outter_settings,
    generateSiteSettingFloor([], '')
  ])

  useEffect(() => {
    const handler = setTimeout(() => {
      const [first_floor, ...remain_reverse_settings] = [...inner_settings].reverse()
      const real_settings = [...remain_reverse_settings].reverse()
      if (hasEmptyFloor(real_settings)) {
        setInnerSettings([
          ...clearEmptyFloor(real_settings),
          first_floor,
        ])
      } else {
        if (first_floor.row.length !== 0) {
          setInnerSettings((latestSettings) => {
            return [
              ...latestSettings,
              generateSiteSettingFloor([], '')
            ]
          })
        }
      }
    }, FLOOR_TRANSITION_DURATION)

    return () => clearTimeout(handler)
  }, [inner_settings])

  function submitChange(manageSettings: SiteSettings) {
    const [new_floor, ...remain_manage_settings] = manageSettings
    let realSettings = reverse(remain_manage_settings)
    emitChange(clearEmptyFloor(reverse(manageSettings)))
    setInnerSettings([...realSettings, new_floor])

    const adjustTimeout = needAdjustWidth({
      oldSettings: outter_settings,
      newSettings: realSettings,
      isAddNewFloor: Boolean(new_floor.row.length),
      limit
    })
    if (adjustTimeout !== false) {
      adjustWidth(adjustTimeout)
    }
  }

  const ProviderCommon = {
    siteSettings: [...inner_settings].reverse(),
    limit,
    adjustWidth,

    edit,
  }

  const callPreventChange = useCallback(() => onPreventChange(), [onPreventChange])

  if (readonly) {
    return (
      <div className={s.SiteSettingsManager}>
        <ManagerContext.Provider
          value={constructContextValue({
            ...ProviderCommon,
            submitChange: callPreventChange,
            setEdit: callPreventChange,
            appendSiteOption: callPreventChange,
            updateFloor: callPreventChange,
            updateOne() {},
          })}
        >
          <DragFloors />
        </ManagerContext.Provider>
      </div>
    )
  } else {
    return (
      <div className={s.SiteSettingsManager}>
        <ManagerContext.Provider
          value={constructContextValue({
            ...ProviderCommon,

            setEdit,
            submitChange,

            appendSiteOption(setting_floor_id, site_opt) {
              const floor_idx = findIndex(propEq('id', setting_floor_id), inner_settings)
              const settingFloor = nth(floor_idx, inner_settings)
              if (settingFloor === undefined) {
                throw Error('settingsFloor not found')
              } else {
                const newR = {
                  ...settingFloor,
                  row: [...settingFloor.row, site_opt]
                }

                submitChange(reverse(update(floor_idx, newR, inner_settings)))
                setEdit(site_opt.id)
              }
            },

            updateFloor(floor_id, new_floor) {
              const idx = findIndex(propEq('id', floor_id), inner_settings)
              if (idx === -1) {
                throw Error('row not found')
              } else {
                submitChange(reverse(update(idx, new_floor, inner_settings)))
              }
            },

            updateOne(updateId, newSiteOption) {
              onChangeOne(updateId, newSiteOption)
              setInnerSettings(latestSettings => {
                return map(setting_floor => {
                  const row = setting_floor.row
                  const find_idx = findIndex(propEq('id', updateId), row)
                  if (find_idx === -1) {
                    return setting_floor
                  } else {
                    return {
                      ...setting_floor,
                      row: update(find_idx, newSiteOption, row)
                    }
                  }
                }, latestSettings)
              })
            },
          })}
        >
          <DragFloors />
        </ManagerContext.Provider>
      </div>
    )
  }
}
