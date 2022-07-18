import { compose, equals, multiply, subtract } from 'ramda'
import React, { CSSProperties } from 'react'

import s from './Selected.module.css'

type Direct = 'LEFT' | 'RIGHT'
const getDirect = (start: number, end: number): Direct => (
  end > start ? 'RIGHT' : 'LEFT'
)

const isLeftDirect = compose( equals('LEFT'), getDirect )
const getLeftPoint = (start_p: number, end_p: number) => (
  isLeftDirect(start_p, end_p) ? end_p : start_p
)

export default function Selected({
  dragStartPoint,
  dragEndPoint,
  intervalWidth,
  backgroundColor,
}: {
  dragStartPoint: number
  dragEndPoint: number
  intervalWidth: number
  backgroundColor?: CSSProperties['backgroundColor']
}) {
  const multiIntervalWidth = multiply(intervalWidth)
  const getLeft = compose(multiIntervalWidth, getLeftPoint)
  const getWidth = compose<[number, number], number, number, number>(
    multiIntervalWidth,
    Math.abs,
    subtract
  )

  return (
    <div className={s.SelectedContainer} style={{ backgroundColor }}>
      <div className={s.Selected} style={{
        left: `${getLeft(dragStartPoint, dragEndPoint)}px`,
        width: `${getWidth(dragEndPoint, dragStartPoint)}px`,
      }}></div>
    </div>
  )
}
