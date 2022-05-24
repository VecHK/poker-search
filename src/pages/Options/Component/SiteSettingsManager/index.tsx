import React, { createContext, useEffect, useState } from 'react'
import { findIndex, map, nth, propEq, reverse, update } from 'ramda'

import DragRows, { ROW_TRANSITION_DURATION } from './DragRows'
import { SiteSettings, SiteSettingsRow, SiteOption, generateSiteSettingsRow } from '../../../../preferences/site-settings'

import s from './index.module.css'
import { Limit } from '../../../../core/base/limit'

export type Edit = SiteOption['id'] | null

const constructContextValue = (append: {
  limit: Limit,
  siteSettings: SiteSettings
  edit: Edit
  setEdit: React.Dispatch<React.SetStateAction<Edit>>
  appendSiteOption(settingsRowId: SiteSettingsRow['id'], siteOption: SiteOption): void
  updateRow: (id: SiteSettingsRow['id'], row: SiteSettingsRow) => void
  updateOne: (id: SiteOption['id'], opt: SiteOption) => void
  submitChange: (settings: SiteSettings) => void
}) => ({ ...append })

export const ManagerContext = createContext(constructContextValue({
  limit: {} as Limit,
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

export default function SiteSettingsManager({
  siteSettings: outterSettings,
  limit,
  onUpdate,
  onChange: emitChange
}: {
  siteSettings: SiteSettings
  limit: Limit
  onUpdate: (id: SiteOption['id'], opt: SiteOption) => void
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
      const hasEmptyRow = !real_settings.every(r => r.row.length)
      if (hasEmptyRow) {
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
    let realSettings = [...remain_manage_settings].reverse()
    emitChange(clearEmptyRow(realSettings))
    setInnerSettings([...realSettings, new_row])
  }

  return (
    <div className={s.SiteSettingsManager}>
      <ManagerContext.Provider
        value={constructContextValue({
          limit,

          siteSettings: [...innerSettings].reverse(),

          edit,
          setEdit,

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
            onUpdate(updateId, newSiteOption)
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

          submitChange,
        })}
      >
        <DragRows />
      </ManagerContext.Provider>
    </div>
  )
}
