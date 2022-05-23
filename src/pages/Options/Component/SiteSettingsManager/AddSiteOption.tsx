import React from 'react'
import { CSSTransition } from 'react-transition-group'
import { SiteWindowFrame } from './SiteWindow'
import plusSrc from './plus.svg'

import s from './AddSiteOption.module.css'

export default function AddSiteOption(props: {
  show: boolean
  disable: boolean
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
      <div className={s.AddSiteOption} style={{ opacity: props.disable ? '0.5' : '' }}>
        <SiteWindowFrame>
          <img
            className={s.AddSite}
            src={plusSrc}
            style={{
              width: '48px',
              height: '48px',
              cursor: props.disable ? '' : 'pointer',
            }}
            alt="add site option"
            onClick={() => {
              if (!props.disable) {
                props.onClickAdd()
              }
            }}
          />
        </SiteWindowFrame>
      </div>
    </CSSTransition>
  )
}
