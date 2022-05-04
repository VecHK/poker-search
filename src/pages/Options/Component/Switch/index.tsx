import React, { useMemo } from 'react'

import s from './index.module.css'

export type SwitchProps = {
  value: boolean
  onChange: (newValue: boolean) => void
}

export default function Switch({ value, onChange }: SwitchProps) {
  const switchState = useMemo(() => {
    return value ? s.On : s.Off
  }, [value])

  return (
    <div
      className={`${s.Switch} ${switchState}`}
      onClick={() => onChange(!value)}
    >
      <div className={s.Ball}></div>
    </div>
  )
}
