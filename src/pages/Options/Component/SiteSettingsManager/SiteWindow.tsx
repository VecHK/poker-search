import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { SiteOption } from '../../../../preferences/site-settings'
import s from './SiteWindow.module.css'

import RemoveIconSrc from './remove.svg'
import EditIconSrc from './edit.svg'
import EditLayout from './EditLayout'
import SiteIcon from './SiteIcon'
import { CSSTransition } from 'react-transition-group'

export function SiteWindowFrame(props: {
  isEdit?: boolean
  isBlur?: boolean
  editChildren?: ReactNode
  children: ReactNode
}) {
  const classes = [s.SiteWindowFrame]

  if (props.isBlur) { classes.push(s.IsBlur) }

  const editNode = useMemo(() => {
    if (props.isEdit === undefined) {
      return null
    } else {
      return (
        <CSSTransition
          in={props.isEdit}
          timeout={382}
          classNames={{
            enter: s.EditChildrenEnter,
            enterActive: s.EditChildrenEnterActive,
            enterDone: s.EditChildrenEnterDone,
            exit: s.EditChildrenExit,
            exitActive: s.EditChildrenExitActive,
            exitDone: s.EditChildrenExitDone,
          }}
        >
          <div className={s.EditChildren}>
            <div className={s.EditChildrenInner}>
              {props.editChildren ? props.editChildren : null}
            </div>
          </div>
        </CSSTransition>
      )
    }
  }, [props.editChildren, props.isEdit])

  return (
    <div className={classes.join(' ')}>
      <div className={s.NormalChildren}>{props.children}</div>
      {editNode}
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
  const [enableEdit, setEnableEdit] = useState<boolean>(false)
  const [editLayoutKey, setEditLayoutKey] = useState<string>(`${Date.now()}`)

  useEffect(() => {
    if (isEdit) {
      setEditLayoutKey(`${Date.now()}`)
      setEditSiteOption(siteOption)
    }
    setEnableEdit(isEdit)
  }, [isEdit, siteOption])

  const editNode = useMemo(() => {
    if (editSiteOption) {
      return (
        <EditLayout
          key={editLayoutKey}
          siteOption={editSiteOption}
          onSubmit={onSubmit}
          onCancel={onCancelEdit}
        />
      )
    } else {
      return null
    }
  }, [editLayoutKey, editSiteOption, onCancelEdit, onSubmit])

  return (
    <SiteWindowFrame
      isEdit={enableEdit}
      isBlur={isBlur}
      editChildren={editNode}
    >
      <div className={s.Above}>
        <SiteIcon
          src={siteOption.icon}
          urlPattern={siteOption.url_pattern}
          onIconUpdate={newSrc => {
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
    </SiteWindowFrame>
  )
}
