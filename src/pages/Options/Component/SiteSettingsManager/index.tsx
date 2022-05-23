import React, { useEffect, useState } from 'react'
import { nth, update } from 'ramda'

import DragRows, { ROW_TRANSITION_DURATION } from './DragRows'
import { SiteSettings, SiteOption, generateSiteSettingsRow } from '../../../../preferences/site-settings'
import { generateExampleOption } from '../../../../preferences/default'

import s from './index.module.css'

export type Edit = SiteOption['id'] | null

export default function SiteSettingsManager({
  siteSettings: outterSettings,
  onUpdate,
  onChange: emitChange
}: {
  siteSettings: SiteSettings
  onUpdate: (id: SiteOption['id'], opt: SiteOption) => void
  onChange: (settings: SiteSettings) => void
}) {
  const [edit, setEdit] = useState<Edit>(null)

  const [innerSettings, setInnerSettings] = useState([
    ...outterSettings,
    generateSiteSettingsRow([], 'N/A')
  ])

  function clearEmptyRow(real_settings: SiteSettings) {
    return real_settings.filter(r => r.row.length)
  }

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

  function handleChange(manageSettings: SiteSettings) {
    const [new_row, ...remain_manage_settings] = manageSettings
    let realSettings = [...remain_manage_settings].reverse()
    emitChange(clearEmptyRow(realSettings))
    setInnerSettings([...realSettings, new_row])
  }

  return (
    <div className={s.SiteSettingsManager}>
      <DragRows
        edit={edit}
        setEdit={setEdit}
        siteSettings={[...innerSettings].reverse()}
        onUpdate={onUpdate}
        onChange={handleChange}
        onClickAdd={(rowFloor) => {
          const manageSettings = [...innerSettings].reverse()
          const settingsRow = nth(rowFloor, manageSettings)
          if (settingsRow !== undefined) {
            const { row } = settingsRow
            const newRow = [...row, generateExampleOption()]
            const newSettings = update(
              rowFloor,
              {
                ...settingsRow,
                row: newRow
              },
              manageSettings
            )
            handleChange(newSettings)

            const willEdit = newRow[newRow.length - 1]
            setEdit(willEdit.id)
          }
        }}
      />
    </div>
  )
}
