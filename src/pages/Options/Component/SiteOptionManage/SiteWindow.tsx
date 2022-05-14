import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { SiteOption } from '../../../../options/site-matrix'
import s from './SiteWindow.module.css'

import RemoveIconSrc from './remove.svg'
import EditIconSrc from './edit.svg'
import EditLayout from './EditLayout'
import SiteIcon from './SiteIcon'

export function SiteWindowFrame(props: {
  isEdit?: boolean
  isBlur?: boolean
  children: ReactNode
}) {
  const classes = [s.SiteWindowFrame]

  if (props.isEdit) { classes.push(s.IsEdit) }
  if (props.isBlur) { classes.push(s.IsBlur) }

  return (
    <div className={classes.join(' ')}>
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
  onChange(id: SiteOption['id'], s: SiteOption): void
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
  onChange,
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
        <SiteIcon
          src={siteOption.icon}
          urlPattern={siteOption.url_pattern}
          onNewIconSrc={newSrc => {
            onChange(siteOption.id, {
              ...siteOption,
              icon: newSrc,
            })
          }}
        />
          
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
