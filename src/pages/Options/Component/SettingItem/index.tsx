import React, { ReactNode, useMemo } from 'react'

import s from './index.module.css'

export default function SettingItem(props: {
  title?: ReactNode
  children: ReactNode
}) {
  const tilteNode = useMemo(() => {
    return (
      <div className={s.Title}>{props.title}</div>
    )
  }, [props.title])
  return (
    <div className={s.SettingItemWrapper}>
      {tilteNode}
      <div className={s.SettingItemInner}>
        {props.children}
      </div>
    </div>
  )
}
