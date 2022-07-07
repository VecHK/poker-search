import React, { ReactNode, useMemo } from 'react'
import { SiteOption } from '../../../../preferences'

import ReactTooltip from 'react-tooltip'

import s from './AccessModeSetting.module.css'

type AccessModeLabelProps = {
  accessMode: SiteOption['access_mode']
  value: SiteOption['access_mode']
  desc: ReactNode
  onClick: (accessMode: SiteOption['access_mode']) => void
  popup?: ReactNode
}
function AccessModeLabel({
  accessMode,
  value,
  desc,
  onClick,
  popup
}: AccessModeLabelProps) {
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

function AccessModeLabelDesc({ preventClick, onClickCircle }: {
  preventClick: boolean
  onClickCircle?: () => void
}) {
  return (
    <>
      强制使用移动端访问
      <span
        className={s.AccessModeCircle}
        onClick={e => {
          if (preventClick) {
            e.preventDefault()
            e.stopPropagation()
          }

          onClickCircle && onClickCircle()
        }}
      >?</span>
    </>
  )
}

export default function AccessModeSetting({
  accessMode,
  onChange,
  showForceMobileAccessTips = true,
  onClickForceMobileAccessTipsCircle,
}: {
  accessMode: SiteOption['access_mode']
  onChange: (a: SiteOption['access_mode']) => void
  showForceMobileAccessTips?: boolean
  onClickForceMobileAccessTipsCircle?: () => void
}) {
  const forceAccessMobileLabel = useMemo(() => {
    const labelNode = (
      <AccessModeLabel
        value={accessMode}
        accessMode='MOBILE-STRONG'
        onClick={onChange}
        desc={
          <AccessModeLabelDesc
            preventClick={!showForceMobileAccessTips}
            onClickCircle={onClickForceMobileAccessTipsCircle}
          />
        }
      />
    )
    if (!showForceMobileAccessTips) {
      return labelNode
    } else {
      return (
        <>
          {labelNode}

          {
            React.createElement(ReactTooltip, {
              place: 'right',
              type: 'dark',
              effect: 'solid',
              children: (
                <article>
                  若你选中此项，这意味着浏览器会通过 debugger 的方式来强行启动页面的移动端版本。<br />
                  缺点是每一个 Chrome 的页面顶部都会<br />
                  出现「"Poker Search" started debugging this browser」的横条。<br />
                  这个横条不应该去关闭，因为关闭了会导致移动端访问失效。<br />
                  另外会对打开窗口的速度造成一定的减缓。
                </article>
              )
            })
          }
        </>
      )
    }
  }, [accessMode, onChange, onClickForceMobileAccessTipsCircle, showForceMobileAccessTips])

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
          {forceAccessMobileLabel}
        </div>
      </div>
    </div>
  )
}
