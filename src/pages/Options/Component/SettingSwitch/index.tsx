import React from 'react'
import Switch from '../Switch'
import s from './index.module.css'

export default function SettingSwitch(props: {
  title: string
  description: string

  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={s.SettingSwitch}>
      <div className={s.Left}>
        <div className={s.Title}>{ props.title }</div>
        <div className={s.Description}>{ props.description }</div>
      </div>
      <div className={s.Right}>
        <Switch value={props.value} onChange={props.onChange} />
      </div>
    </div>
  )
}
