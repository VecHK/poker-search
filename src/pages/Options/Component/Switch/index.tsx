import React, { useMemo } from 'react'

import s from './index.module.css'

export type SwitchProps = {
  name?: string
  value: boolean
  onChange?: (newValue: boolean) => void
}

export default function Switch({
  name,
  value,
  onChange
}: SwitchProps) {
  const switchState = useMemo(() => {
    return value ? s.On : s.Off
  }, [value])

  return (
    <label
      className={`${s.Switch} ${switchState}`}
    >
      <div className={s.Ball}></div>
      <input
        className={s.Checkbox}
        type="checkbox"
        name={name}
        checked={value}
        onChange={e => {
          if (onChange) {
            onChange(!value)
          }
        }}
      />
    </label>
  )
}
