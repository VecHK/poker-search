import React, { ReactNode, useMemo } from 'react'

import s from './index.module.css'

export default function SettingItem(props: {
  title?: ReactNode
  children: ReactNode
}) {
  const tilteNode = useMemo(() => {
    if (props.title) {
      return <div className={s.Title}>{props.title}</div>
    } else {
      return null
    }
  }, [props.title])

  return (
    <div className={s.SettingItem}>
      {tilteNode}
      <div className={s.SettingItemInner}>
        {props.children}
      </div>
    </div>
  )
}
