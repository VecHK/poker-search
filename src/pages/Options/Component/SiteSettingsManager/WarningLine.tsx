import React, { useMemo } from 'react'
import { Transition } from 'react-transition-group'

import { calcWindowsTotalWidth } from '../../../../core/base/auto-adjust'

import s from './WarningLine.module.css'

const DURATION = 382

function useLeft(maxWindowPerLine: number) {
  return useMemo(() => {
    const SiteWindowBorderWidth = 2
    const SiteWindowWidth = 128 + SiteWindowBorderWidth * 2
    const SiteWindowGap = 16
    const SiteWindowGapHalf = SiteWindowGap / 2
    const SettingItemPadding = 20
    const HandlerWidth = 34
    const LineWidthHalf = 1 / 2
    
    const width = calcWindowsTotalWidth(
      maxWindowPerLine, SiteWindowWidth, SiteWindowGap
    )

    const BaseLeft = SiteWindowGapHalf + SettingItemPadding + HandlerWidth
    return `${BaseLeft + width + SiteWindowGapHalf - LineWidthHalf}px`
  }, [maxWindowPerLine])
}

export default function WarningLine({
  disable,
  maxWindowPerLine
}: { disable: boolean; maxWindowPerLine: number }) {
  const left = useLeft(maxWindowPerLine)

  const DescriptionWidth = 200
  const DescriptionLeft = -6.5
  const ComponentWidth = DescriptionWidth + DescriptionLeft

  const transitionStyles: Record<string, React.CSSProperties> = {
    entering: { opacity: 1, left },
    entered:  { opacity: 1, left },
    exiting:  { opacity: 0, left },
    exited:  { opacity: 0, left: `calc(100% - ${ComponentWidth}px)`, transition: 'left 382ms' },
  }

  return (
    <Transition in={!disable} timeout={DURATION}>
      {state => (
        <div
          className={`${s.WarningLineWrapper} ${(!disable) ? s.WarningEnable : ''}`}
          style={{
            transition: 'opacity 382ms',
            ...transitionStyles[state],
          }}
        >
          <div className={s.WarningLine}></div>
          <div className={s.WarningDescription}>超过屏幕所能并列显示的窗口数</div>
        </div>
      )}
    </Transition>
  )
}
