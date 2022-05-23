import React, { useEffect, useState } from 'react'
import { nth, update } from 'ramda'

import DragRows, { ROW_TRANSITION_DURATION } from './DragRows'
import { SiteSettings, SiteOption, generateSiteSettingsRow } from '../../../../preferences/site-settings'
import { generateExampleOption } from '../../../../preferences/default'

import s from './index.module.css'
import ImportExport from './ImportExport'

type Pos = Readonly<[number, number]>

export default function SiteOptionManage({
  siteSettings: outterSettings,
  onUpdate,
  onChange: emitChange
}: {
  siteSettings: SiteSettings
  onUpdate: (id: SiteOption['id'], opt: SiteOption) => void
  onChange: (settings: SiteSettings) => void
}) {
  const [edit, setEdit] = useState<Pos | null>(null)

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
          ...real_settings.filter(r => r.row.length),
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
    emitChange(realSettings)
    setInnerSettings([...realSettings, new_row])
  }

  return (
    <div className={s.SiteOptionManage}>
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
            emitChange([...newSettings].reverse())
            setEdit([rowFloor, newRow.length - 1])
          }
        }}
      />
      <ImportExport
        siteSettings={outterSettings}
        onImport={emitChange}
      />
    </div>
  )
}
