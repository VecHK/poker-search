import React, { createContext, useCallback, useEffect, useState } from 'react'
import { findIndex, map, nth, propEq, reverse, update } from 'ramda'

import cfg from '../../../../config'
import {
  SiteSettings,
  SiteSettingsRow,
  SiteOption,
  generateSiteSettingsRow,
  toMatrix
} from '../../../../preferences/site-settings'

import { Limit } from '../../../../core/base/limit'
import { autoAdjustWidth } from '../../../../core/base/auto-adjust'

import DragRows, { ROW_TRANSITION_DURATION } from './DragRows'

import s from './index.module.css'

export type Edit = SiteOption['id'] | null

const constructContextValue = (append: {
  siteSettings: SiteSettings
  adjustWidth: (t: number) => void
  limit: Limit,
  edit: Edit
  setEdit: React.Dispatch<React.SetStateAction<Edit>>
  appendSiteOption(settingsRowId: SiteSettingsRow['id'], siteOption: SiteOption): void
  updateRow: (id: SiteSettingsRow['id'], row: SiteSettingsRow) => void
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
  updateRow: () => {},
  updateOne: () => {},
  submitChange: () => {},
}))

function clearEmptyRow(real_settings: SiteSettings) {
  return real_settings.filter(r => r.row.length)
}

function calcMaxColumn(siteSettings: SiteSettings) {
  return toMatrix(siteSettings).reduce((p, c) => Math.max(p, c.length), 0)
}

function hasEmptyRow(siteSettingsRows: SiteSettings) {
  return !siteSettingsRows.every(r => r.row.length)
}

function needAdjustWidth({
  oldSettings,
  newSettings,
  isAddNewRow,
  limit,
}: {
  oldSettings: SiteSettings
  newSettings: SiteSettings
  isAddNewRow: boolean
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
    if (hasEmptyRow(newSettings) || isAddNewRow) {
      return 1000
    } else {
      return 500
    }
  } else {
    return false
  }
}

export default function SiteSettingsManager({
  siteSettings: outterSettings,
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

  const [innerSettings, setInnerSettings] = useState([
    ...outterSettings,
    generateSiteSettingsRow([], 'N/A')
  ])

  useEffect(() => {
    const handler = setTimeout(() => {
      const [first_row, ...remain_reverse_settings] = [...innerSettings].reverse()
      const real_settings = [...remain_reverse_settings].reverse()
      if (hasEmptyRow(real_settings)) {
        setInnerSettings([
          ...clearEmptyRow(real_settings),
          first_row,
        ])
      } else {
        if (first_row.row.length !== 0) {
          setInnerSettings((latestSettings) => {
            return [
              ...latestSettings,
              generateSiteSettingsRow([], 'N/A')
            ]
          })
        }
      }
    }, ROW_TRANSITION_DURATION)

    return () => clearTimeout(handler)
  }, [innerSettings])

  function submitChange(manageSettings: SiteSettings) {
    const [new_row, ...remain_manage_settings] = manageSettings
    let realSettings = reverse(remain_manage_settings)
    emitChange(clearEmptyRow(reverse(manageSettings)))
    setInnerSettings([...realSettings, new_row])

    const adjustTimeout = needAdjustWidth({
      oldSettings: outterSettings,
      newSettings: realSettings,
      isAddNewRow: Boolean(new_row.row.length),
      limit
    })
    if (adjustTimeout !== false) {
      adjustWidth(adjustTimeout)
    }
  }

  const ProviderCommon = {
    siteSettings: [...innerSettings].reverse(),
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
            updateRow: callPreventChange,
            updateOne() {},
          })}
        >
          <DragRows />
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

            appendSiteOption(settingsRowId, siteOption) {
              const row = findIndex(propEq('id', settingsRowId), innerSettings)
              const settingsRow = nth(row, innerSettings)
              if (settingsRow === undefined) {
                throw Error('settingsRow not found')
              } else {
                const newR = {
                  ...settingsRow,
                  row: [...settingsRow.row, siteOption]
                }

                submitChange(reverse(update(row, newR, innerSettings)))
                setEdit(siteOption.id)
              }
            },

            updateRow(rowId, newRow) {
              const row = findIndex(propEq('id', rowId), innerSettings)
              if (row === -1) {
                throw Error('row not found')
              } else {
                submitChange(reverse(update(row, newRow, innerSettings)))
              }
            },

            updateOne(updateId, newSiteOption) {
              onChangeOne(updateId, newSiteOption)
              setInnerSettings(latestSettings => {
                return map(settings_row => {
                  const row = settings_row.row
                  const find_idx = findIndex(propEq('id', updateId), row)
                  if (find_idx === -1) {
                    return settings_row
                  } else {
                    return {
                      ...settings_row,
                      row: update(find_idx, newSiteOption, row)
                    }
                  }
                }, latestSettings)
              })
            },
          })}
        >
          <DragRows />
        </ManagerContext.Provider>
      </div>
    )
  }
}
