import React, { ReactNode, useMemo } from 'react'

import s from './index.module.css'
import SettingItemTitle from './SettingItemTitle'

export default function SettingItem(props: {
  className?: string
  innerClassName?: string
  title?: ReactNode
  disableMargin?: boolean
  children: ReactNode
}) {
  const tilteNode = useMemo(() => {
    if (props.title) {
      return <SettingItemTitle>{props.title}</SettingItemTitle>
    } else {
      return null
    }
  }, [props.title])

  return (
    <div className={`${s.SettingItem} ${props.className ? props.className : ''}`} style={{ margin: props.disableMargin ? 'unset' : '' }}>
      {tilteNode}
      <div className={`${s.SettingItemInner} ${props.innerClassName ? props.innerClassName : ''}`}>
        {props.children}
      </div>
    </div>
  )
}
