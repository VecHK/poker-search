import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { SiteOption } from '../../../../options/site-matrix'
import s from './SiteWindow.module.css'

import RemoveIconSrc from './remove.svg'
import EditIconSrc from './edit.svg'
import EditLayout from './EditLayout'

export function SiteWindowFrame(props: {
  isEdit?: boolean
  isBlur?: boolean
  children: ReactNode
}) {
  const isEditClass = props.isEdit ? s.IsEdit : ''
  const blurClass = props.isBlur ? s.IsBlur : ''
  return (
    <div className={`${s.SiteWindowFrame} ${isEditClass} ${blurClass}`}>
      {props.children}
    </div>
  )
}

function urlToDomain(url: string): string {
  const u = new URL(url)
  return u.hostname
}

type SiteWindowProps = {
  isEdit: boolean
  isBlur: boolean
  siteOption: SiteOption
  onSubmit(s: SiteOption): void
  onCancelEdit(): void
  onClickRemove(): void
  onClickEdit(): void
}

export default function SiteWindow({
  isEdit, 
  isBlur,
  siteOption,
  onClickRemove,
  onSubmit,
  onClickEdit,
  onCancelEdit
}: SiteWindowProps) {
  const [editSiteOption, setEditSiteOption] = useState<SiteOption | null>(null)

  useEffect(() => {
    if (isEdit) {
      setEditSiteOption(siteOption)
    } else {
      setEditSiteOption(null)
    }

    return () => {
      setEditSiteOption(null)
    }
  }, [isEdit, siteOption])

  const editNode = useMemo(() => {
    if (isEdit && editSiteOption) {
      return (
        <EditLayout
          siteOption={editSiteOption}
          onSubmit={onSubmit}
          onCancel={onCancelEdit}
        />
      )
    } else {
      return null
    }
  }, [editSiteOption, isEdit, onCancelEdit, onSubmit])

  return (
    <SiteWindowFrame isEdit={isEdit} isBlur={isBlur}>
      <div className={s.Above}>
        <div className={s.SiteIcon}></div>
        <div className={s.UrlPattern}>
          {urlToDomain(siteOption.url_pattern)}
        </div>
      </div>
      <div className={s.Bottom}>
        <div className={s.ButtonGroup}>
          <img
            className={s.RemoveIcon}
            src={RemoveIconSrc}
            alt="remove site option"
            style={{ visibility: isBlur ? 'hidden' : undefined }}
            onClick={() => isBlur || onClickRemove()}
          />

          <img
            className={s.EditIcon}
            src={EditIconSrc}
            alt="edit site option"
            style={{ visibility: isBlur ? 'hidden' : undefined }}
            onClick={() => isBlur || onClickEdit()}
          />
        </div>
      </div>
      {editNode}
    </SiteWindowFrame>
  )
}
