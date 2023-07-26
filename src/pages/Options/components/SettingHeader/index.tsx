import React, { useEffect, useState } from 'react'
import s from './index.module.css'
import LogoSrc from './logo.svg'
import Version from './version'
import { getStorageVersion } from '../../../../x-state/storage-version'

export default function Header(prop: {
  currentVersion: string
  newVersion: string
}) {
  return (
    <div className={s.SettingHeader}>
      <div className={s.Left}>
        <div className={s.Title}>Poker - 一种新的全方位浏览器交互</div>
        <Version { ...prop } />
      </div>
      <div className={s.Right}>
        <img className={s.Logo} src={LogoSrc} alt="poker logo" />
      </div>
    </div>
  )
}

export function useVersionLoading() {
  const [version, setVersion] = useState<null | string>(null)

  useEffect(() => {
    getStorageVersion().then(setVersion)
  }, [])

  return version
}
