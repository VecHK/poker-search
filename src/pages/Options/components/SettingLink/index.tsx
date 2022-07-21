import React, { ReactNode } from 'react'
import s from './index.module.css'

export default function SettingLink(props: { title: ReactNode }) {
  return (
    <div className={s.SettingLink}>
      <div className={s.Left}>{ props.title }</div>
      <div className={s.Right}>{'>'}</div>
    </div>
  )
}
