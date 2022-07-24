import React, { ReactNode } from 'react'

import s from './SettingItemTitle.module.css'

export default function SettingItemTitle({ children }: { children: ReactNode }) {
  return (
    <div className={s.Title}>{children}</div>
  )
}
