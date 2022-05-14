import React, { useMemo, useState } from 'react'
import s from './index.module.css'

import DragRows from './DragRows'
import { generateExampleOption, SiteMatrix, SiteOption } from '../../../../options/site-matrix'
import SettingItem from '../SettingItem'
import { SiteWindowFrame } from './SiteWindow'

import plusSrc from './plus.svg'
import { nth, update } from 'ramda'

type Pos = Readonly<[number, number]>

export default function SiteOptionManage({ siteMatrix, onUpdate, onChange }: {
  siteMatrix: SiteMatrix
  onUpdate: (id: SiteOption['id'], option: SiteOption) => void
  onChange: (newMatrix: SiteMatrix) => void
}) {
  const [edit, setEdit] = useState<Pos | null>(null)

  const newRowNode = useMemo(() => {
    if (edit) {
      return null
    } else {
      return (
        <SettingItem>
          <div className={s.NewRowInner}>
            <SiteWindowFrame>
              <img
                className={s.AddSite}
                src={plusSrc}
                alt="add site option"
                onClick={() => {
                  const newMatrix = [[generateExampleOption()], ...siteMatrix]
                  onChange(newMatrix)
                  setEdit([newMatrix.length - 1, 0])
                }}
              />
            </SiteWindowFrame>
          </div>
        </SettingItem>
      )
    }
  }, [edit, onChange, siteMatrix])

  return (
    <div className={s.SiteOptionManage}>
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
      {newRowNode}
    </div>
  )
}
