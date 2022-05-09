import React from 'react'
import s from './index.module.css'
import LogoSrc from './logo.svg'

export default function Header({ version}: { version: string }) {
  return (
    <div className={s.SettingHeader}>
      <div className={s.Left}>
        <div className={s.Title}>Poker - 一种新的全方位浏览器交互</div>
        <div className={s.Version}>v{version}</div>
      </div>
      <div className={s.Right}>
        <img className={s.Logo} src={LogoSrc} alt="poker logo" />
      </div>
    </div>
  )
}
