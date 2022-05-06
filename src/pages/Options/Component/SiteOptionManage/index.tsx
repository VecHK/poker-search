import React from 'react'
import s from './index.module.css'

import DragRows from './DragRows'
import { SiteMatrix } from '../../../../options/site-matrix'
import SettingItem from '../SettingItem'
import SiteWindow, { SiteWindowFrame } from './SiteWindow'

import plusSrc from './plus.svg' 

export default function SiteOptionManage(props: {
  siteMatrix: SiteMatrix
  onChange: (newMatrix: SiteMatrix) => void
}) {
  return (
    <div className={s.SiteOptionManage}>
      {/* <DragList
        siteMatrix={props.siteMatrix}
        onChange={props.onChange}
      /> */}
      <DragRows siteMatrix={props.siteMatrix} onChange={props.onChange} />
      <SettingItem>
        <SiteWindowFrame>
          <img className={s.AddSite} src={plusSrc} alt="add site option" />
        </SiteWindowFrame>
      </SettingItem>
    </div>
  )
}
