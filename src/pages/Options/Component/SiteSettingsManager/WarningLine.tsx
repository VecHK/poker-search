import React, { useEffect, useMemo, useState } from 'react'
import { Transition } from 'react-transition-group'

import cfg from '../../../../config'
import { autoAdjustWidth, calcWindowsTotalWidth } from '../../../../core/base/auto-adjust'
import { getCurrentDisplayLimit } from '../../../../core/base/limit'
import { SiteSettings } from '../../../../preferences'

import s from './WarningLine.module.css'

const DURATION = 382

export function useMaxWindowPerLine() {
  const [maxWindowPerLine, setMaxWindowPerLine] = useState<null | number>(null)
  useEffect(() => {
    getCurrentDisplayLimit().then(limit => {
      const { max_window_per_line } = autoAdjustWidth(
        cfg.SEARCH_WINDOW_GAP_HORIZONTAL, limit.width,
      )
      setMaxWindowPerLine(max_window_per_line)
    })
  }, [])
  return maxWindowPerLine
}

export default function WarningLine(
  { disable, siteSettings }: { disable: boolean; siteSettings: SiteSettings }
) {
  const maxWindowPerLine = useMaxWindowPerLine()

  const hasMaxCol = useMemo(() => {
    if (maxWindowPerLine === null) {
      return false
    } else {
      return !siteSettings.every((r) => {
        if (maxWindowPerLine === -1) {
          return false
        } else {
          return r.row.length <= maxWindowPerLine
        }
      })
    }
  }, [maxWindowPerLine, siteSettings])

  const left = useMemo(() => {
    if (maxWindowPerLine === null) {
      return 0
    } else {
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
    }
  }, [maxWindowPerLine])

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
    <Transition in={hasMaxCol} timeout={DURATION}>
      {state => (
        <div
          className={`${s.WarningLineWrapper} ${(!disable && hasMaxCol) ? s.WarningEnable : ''}`}
          style={{
            display: maxWindowPerLine === null ? 'none' : '',
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
