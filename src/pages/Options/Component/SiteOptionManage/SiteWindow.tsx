import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { SiteOption, toSearchURL } from '../../../../options/site-matrix'
import s from './SiteWindow.module.css'

import RemoveIconSrc from './remove.svg'
import EditIconSrc from './edit.svg'
import EditLayout from './EditLayout'
import loadIcon from '../../../../utils/get-icon'

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

const iconSrcStorage = Object.create(null)

function SiteIcon({ urlPattern }: { urlPattern: string }) {
  const [iconSrc, setIconSrc] = useState<null | string>(null)
  
  useEffect(() => {
    Object.assign(window, { loadIcon, toSearchURL })
    if (!iconSrcStorage[urlPattern]) {
      loadIcon(toSearchURL(urlPattern, 'hello')).then(iconSrc => {
        iconSrcStorage[urlPattern] = iconSrc
        setIconSrc(() => iconSrcStorage[urlPattern])
      })
    }
  }, [urlPattern])

  let src = iconSrcStorage[urlPattern]
  if (!src) {
    src = iconSrc
  }

  return useMemo(() => (
    <img style={{ width: '100%' }} src={src} alt="SiteIcon" />
  ), [src])
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
        <div className={s.SiteIcon}>
          <SiteIcon urlPattern={siteOption.url_pattern} />
        </div>
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
