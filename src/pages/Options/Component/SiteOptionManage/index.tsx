import React, { useEffect, useMemo, useState } from 'react'
import { nth, update } from 'ramda'

import DragRows from './DragRows'
import { SiteSettings, SiteOption } from '../../../../preferences/site-settings'
import { generateExampleOption } from '../../../../preferences/default'
import AddNewRow from './AddNewRow'

import s from './index.module.css'
import ImportExport from './ImportExport'


type Pos = Readonly<[number, number]>

export default function SiteOptionManage({ siteSettings, onUpdate, onChange }: {
  siteSettings: SiteSettings
  onUpdate: (id: SiteOption['id'], opt: SiteOption) => void
  onChange: (settings: SiteSettings) => void
}) {
  const [edit, setEdit] = useState<Pos | null>(null)

  useEffect(() => {
    const hasEmptyRow = !siteSettings.every(r => r.row.length)
    if (hasEmptyRow) {
      onChange( siteSettings.filter(r => r.row.length) )
    }
  }, [onChange, siteSettings])

  // const newRowNode = useMemo(() => {
  //   return (
  //     <AddNewRow
  //       isEdit={Boolean(edit)}
  //       onClickAdd={() => {
  //         const newMatrix = [...siteMatrix, [generateExampleOption()]]
  //         onChange(newMatrix)
  //         setEdit([0, 0])
  //       }}
  //     />
  //   )
  // }, [edit, onChange, siteMatrix])

  return (
    <div className={s.SiteOptionManage}>
      {/* {newRowNode} */}
      <DragRows
        edit={edit}
        setEdit={setEdit}
        siteSettings={[...siteSettings].reverse()}
        onUpdate={onUpdate}
        onChange={(manageSettings) => {
          let newSettings = [...manageSettings].reverse()
          onChange( newSettings )
        }}
        onClickAdd={(rowFloor) => {
          const manageSettings = [...siteSettings].reverse()
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
            onChange([...newSettings].reverse())
            setEdit([rowFloor, newRow.length - 1])
          }
        }}
      />
      <ImportExport
        siteSettings={siteSettings}
        onImport={onChange}
      />
    </div>
  )
}
