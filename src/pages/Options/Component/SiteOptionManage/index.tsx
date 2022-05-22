import React, { useMemo, useState } from 'react'
import { nth, update } from 'ramda'

import DragRows from './DragRows'
import { SiteMatrix, SiteOption } from '../../../../options/site-matrix'
import { generateExampleOption } from '../../../../options/default'
import AddNewRow from './AddNewRow'

import s from './index.module.css'
import ImportExport from './ImportExport'


type Pos = Readonly<[number, number]>

export default function SiteOptionManage({ siteMatrix, onUpdate, onChange }: {
  siteMatrix: SiteMatrix
  onUpdate: (id: SiteOption['id'], option: SiteOption) => void
  onChange: (newMatrix: SiteMatrix) => void
}) {
  const [edit, setEdit] = useState<Pos | null>(null)

  const newRowNode = useMemo(() => {
    return (
      <AddNewRow
        isEdit={Boolean(edit)}
        onClickAdd={() => {
          const newMatrix = [...siteMatrix, [generateExampleOption()]]
          onChange(newMatrix)
          setEdit([0, 0])
        }}
      />
    )
  }, [edit, onChange, siteMatrix])

  return (
    <div className={s.SiteOptionManage}>
      {newRowNode}
      <DragRows
        edit={edit}
        setEdit={setEdit}
        siteMatrix={[...siteMatrix].reverse()}
        onUpdate={onUpdate}
        onChange={(manageMatrix) => {
          let newMatrix = [...manageMatrix].reverse()
          const hasEmptyRow = !newMatrix.every(row => row.length)
          if (hasEmptyRow) {
            onChange( newMatrix.filter(row => row.length) )
          } else {
            onChange(newMatrix)
          }
        }}
        onClickAdd={(rowFloor) => {
          const manageMatrix = [...siteMatrix].reverse()
          const row = nth(rowFloor, manageMatrix)
          if (row !== undefined) {
            const newRow = [...row, generateExampleOption()]
            const newMatrix = update(rowFloor, newRow, manageMatrix)
            onChange([...newMatrix].reverse())
            setEdit([rowFloor, newRow.length - 1])
          }
        }}
      />
      <ImportExport
        siteMatrix={siteMatrix}
        onImport={(newMatrix) => {
          onChange(newMatrix)
        }}
      />
    </div>
  )
}
