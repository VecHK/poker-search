import React, { CSSProperties } from 'react'

import s from './Selected.module.css'

const getDirect = (start_p: number, end_p: number) => (
  end_p > start_p ? 'RIGHT' : 'LEFT'
)
const isLeftDirect = (start_p: number, end_p: number) => (
  getDirect(start_p, end_p) === 'LEFT'
)
const getLeftPoint = (start_p: number, end_p: number) => (
  isLeftDirect(start_p, end_p) ? end_p : start_p
)

export default function Selected({
  startPoint,
  endPoint,
  intervalWidth,
  backgroundColor,
}: {
  startPoint: number
  endPoint: number
  intervalWidth: number
  backgroundColor?: CSSProperties['backgroundColor']
}) {
  const multiInterval = (n: number) => intervalWidth * n
  const left = multiInterval( getLeftPoint(startPoint, endPoint) )
  const width = multiInterval( Math.abs(startPoint - endPoint) )

  return (
    <div className={s.SelectedContainer} style={{ backgroundColor }}>
      <div className={s.Selected} style={{
        left: `${left}px`,
        width: `${width}px`,
      }}></div>
    </div>
  )
}
