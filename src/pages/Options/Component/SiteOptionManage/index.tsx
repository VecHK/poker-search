import React, { useMemo, useState } from 'react'
import s from './index.module.css'

import DragRows from './DragRows'
import { generateExampleOption, SiteMatrix } from '../../../../options/site-matrix'
import SettingItem from '../SettingItem'
import { SiteWindowFrame } from './SiteWindow'

import plusSrc from './plus.svg' 

type Pos = Readonly<[number, number]>

export default function SiteOptionManage({ siteMatrix, onChange }: {
  siteMatrix: SiteMatrix
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
                  const newMatrix = [...siteMatrix, [generateExampleOption()]]
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
        siteMatrix={siteMatrix}
        edit={edit}
        setEdit={setEdit}
        onChange={(newMatrix) => {
          const hasEmptyRow = !newMatrix.every(row => row.length)
          if (hasEmptyRow) {
            onChange( newMatrix.filter(row => row.length) )
          } else {
            onChange(newMatrix)
          }
        }}
      />
      {newRowNode}
    </div>
  )
}
