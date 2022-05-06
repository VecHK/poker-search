import React, { ReactNode } from 'react'
import s from './SiteWindow.module.css'

export function SiteWindowFrame(props: { children: ReactNode }) {
  return (
    <div className={s.SiteWindowFrame}>
      {props.children}
    </div>
  )
}

export default function SiteWindow() {
  return (
    <SiteWindowFrame>
      <div className={s.Above}>
        <div className={s.Icon}></div>
        {/* <div className={s.UrlPattern}>{str}</div> */}
        <div className={s.UrlPattern}>urlpattern</div>
      </div>
      <div className={s.Bottom}>
        <div className={s.ButtonGroup}>
          {/* <button className={s.Button}>+</button> */}
          <button
            className={s.Button}
            type="button"
            onClick={() => {
              // onClickRemove()
            }}
          >
            -
          </button>
        </div>
      </div>
    </SiteWindowFrame>
  )
}
