import React from 'react'
import { CSSTransition } from 'react-transition-group'
import { SiteWindowFrame } from './SiteWindow'
import plusSrc from './plus.svg'

import s from './AddSiteOption.module.css'

export default function AddSiteOption(props: {
  show: boolean
  onClickAdd(): void
}) {
  return (
    <CSSTransition
      in={props.show}
      timeout={382}
      classNames={{
        enter: s.AddSiteOptionEnter,
        enterActive: s.AddSiteOptionEnterActive,
        enterDone: s.AddSiteOptionEnterDone,
        exit: s.AddSiteOptionExit,
        exitActive: s.AddSiteOptionExitActive,
        exitDone: s.AddSiteOptionExitDone,
      }}
    >
      <div className={s.AddSiteOption}>
        <SiteWindowFrame>
          <img
            className={s.AddSite}
            src={plusSrc}
            style={{ cursor: 'pointer', width: '48px', height: '48px' }}
            alt="add site option"
            onClick={props.onClickAdd}
          />
        </SiteWindowFrame>
      </div>
    </CSSTransition>
  )
}
