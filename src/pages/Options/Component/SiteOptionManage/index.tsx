import React from 'react'
import s from './index.module.css'

import DragList from './DragList'

export default function SiteOptionManage(props: {}) {
  return (
    <div className={s.SiteOptionManage}>
      <DragList />
    </div>
  )
}
