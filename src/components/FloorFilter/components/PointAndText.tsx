import React, { CSSProperties } from 'react'
import s from './PointAndText.module.css'

export default function PointAndText({
  floors,
  highlightList,
  intervalWidth,
  onMouseDownPoint,
}: {
  floors: number[]
  highlightList: number[]
  intervalWidth: Exclude<CSSProperties['width'], undefined>
  onMouseDownPoint: (mouse_start_x: number, point: number) => void
}) {
  function isHighlight(floor_idx: number) {
    return highlightList.indexOf(floor_idx) !== -1
  }

  return (
    <>
      <div className={s.FloorTextLayout}>
        {floors.map(floor_idx => {
          return (
            <div
              key={floor_idx}
              className={`${s.FloorText} ${isHighlight(floor_idx) ? s.FloorTextHighlight : ''}`}
              style={{ left: `calc(${floor_idx} * ${intervalWidth} - ( var(--text-width) / 2 ))`
            }}>{floor_idx + 1}F</div>
          )
        })}
      </div>
      <div className={s.FloorPointLayout}>
        {floors.map(floor_idx => {
          return (
            <div
              key={floor_idx}
              className={`${s.FloorPoint} ${isHighlight(floor_idx) ? s.FloorPointHighlight : ''}`}
              style={{ left: `calc(${floor_idx} * ${intervalWidth} - ( var(--point-size) / 2 ))`}}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                onMouseDownPoint(e.clientX, floor_idx)
              }}
            ></div>
          )
        })}
      </div>
    </>
  )
}
