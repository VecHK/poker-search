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
                  如果你开启强制移动端，浏览器会弹出开启开发模式的警告。<br />
                  并且此权限，不在普通的插件权限中。这意味着你开启后，隐私或许有被泄露的风险<br />
                  同时，页面也会有崩溃可能。
                </article>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
