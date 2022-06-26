import React, { ReactNode } from 'react'
import { SiteOption } from '../../../../preferences'

import ReactTooltip from 'react-tooltip'

import s from './AccessModeSetting.module.css'

function AccessModeLabel({
  accessMode,
  value,
  desc,
  onClick,
  popup
}: {
  accessMode: SiteOption['access_mode']
  value: SiteOption['access_mode']
  desc: ReactNode
  onClick: (accessMode: SiteOption['access_mode']) => void
  popup?: ReactNode
}) {
  return (
    <div className={s.AccessModeLabelWrapper}>
      <label
        onClick={() => onClick(accessMode)}
        className={s.AccessModeLabel}
      >
        <input
          className={s.AccessModeInput}
          type="radio"
          name="access_mode"
          readOnly
          value={accessMode}
          checked={accessMode === value}
        />
        <span className={s.AccessModeDesc}>{desc}</span>
      </label>
    </div>
  )
}


export default function AccessModeSetting({
  accessMode,
  onChange
}: {
  accessMode: SiteOption['access_mode']
  onChange: (a: SiteOption['access_mode']) => void
}) {
  return (
    <div className={s.AccessMode}>
      <span>访问方式</span>
      <div>
        <AccessModeLabel
          value={accessMode}
          accessMode='DESKTOP'
          desc="使用电脑端访问"
          onClick={onChange}
        />
        <AccessModeLabel
          value={accessMode}
          accessMode='MOBILE'
          desc="使用移动端访问"
          onClick={onChange}
        />

        <div data-tip="React-tooltip">
          <AccessModeLabel
            value={accessMode}
            accessMode='MOBILE-STRONG'
            onClick={onChange}
            desc={
              <>
                强制使用移动端访问 <span className={s.AccessModeCircle}>?</span>
              </>
            }
          />

          {
            React.createElement(ReactTooltip, {
              place: 'right',
              type: 'dark',
              effect: 'solid',
              children: (
                <article>
                  将会使用效果最好的移动端访问方式。缺点是每一个 Chrome 的页面顶部都会<br />
                  出现「"Poker Search" started debugging this browser」的横条。<br />
                  另外会对打开窗口的速度造成一定的减缓。
                </article>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
