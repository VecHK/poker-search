import React, { useState } from 'react'
import Switch from '../Switch'
import s from './index.module.css'

export default function SettingSwitch(props: {
  title: string
  description: string
}) {
  const [value, setValue] = useState(false)
  return (
    <div className={s.SettingSwitch}>
      <div className={s.Left}>
        <div className={s.Title}>{ props.title }</div>
        <div className={s.Description}>{ props.description }</div>
      </div>
      <div className={s.Right}>
        <Switch value={value} onChange={setValue} />
      </div>
    </div>
  )
}
