import { multiply } from 'ramda'
import React, { CSSProperties, forwardRef, useEffect, useMemo, useRef } from 'react'
import useOffsetWidth from '../hooks/useOffsetWidth'
import s from './PointAndText.module.css'

type Props = {
  textList: string[]
  floorIndexList: number[]
  highlightList: number[]
  intervalWidth: Exclude<CSSProperties['width'], undefined>
  onMouseDownPoint: (mouse_start_x: number, point: number) => void
}

export default forwardRef<number, Props>(function PointAndText({
  textList,
  floorIndexList,
  highlightList,
  intervalWidth,
  onMouseDownPoint,
}, ref) {
  function isHighlight(floor_idx: number) {
    return highlightList.indexOf(floor_idx) !== -1
  }

  const heightListRef = useRef<number[]>([])

  const max_height = Math.max(...heightListRef.current)

  useEffect(() => {
    if (typeof ref === 'function') {
      ref(max_height)
    } else if (ref) {
      ref.current = max_height
    }
  }, [max_height, ref])

  return (
    <>
      <div className={s.FloorTextLayout}>
        {floorIndexList.map(floor_idx => {
          return (
            <FloorText
              ref={(height) => {
                if (height !== null) {
                  heightListRef.current[floor_idx] = height
                } else {
                  heightListRef.current[floor_idx] = 0
                }
              }}
              key={floor_idx}
              floorIdx={floor_idx}
              highlight={isHighlight(floor_idx)}
              intervalWidth={intervalWidth}
              text={ textList[floor_idx] }
            />
          )
        })}
      </div>
      <div className={s.FloorPointLayout}>
        {floorIndexList.map(floor_idx => {
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
})

const ONE_ANGLE = Math.PI / 180
const deg = multiply(ONE_ANGLE)
function calcHeight(angle: number, len: number) {
  return Math.sin(angle) * len
}

type FloorTextProps = {
  floorIdx: number
  highlight: boolean
  intervalWidth: Exclude<CSSProperties['width'], undefined>
  text: string
}

const FloorText = forwardRef<number, FloorTextProps>(({
  floorIdx,
  highlight,
  intervalWidth,
  text,
}, ref) => {
  const [offset_width, innerTextRef] = useOffsetWidth()

  const angle = 35
  const height = useMemo(() => (
    calcHeight(deg(angle), offset_width)
  ), [offset_width])

  const interval_top = 7

  useEffect(() => {
    if (typeof ref === 'function') {
      ref(height + interval_top)
    } else if (ref) {
      ref.current = height + interval_top
    }
  }, [height, ref])

  return (
    <div
      className={`${s.FloorText} ${highlight ? s.FloorTextHighlight : ''}`}
      style={{
        left: `calc(${floorIdx} * ${intervalWidth} - ( var(--text-width) / 2 ))`,
        '--deg': `${angle}deg`,
        '--interval-top': `${interval_top}px`
      } as CSSProperties}
    >
      {/* <div className={s.Height} style={{ height: `${height}px` }}></div> */}
      <span ref={innerTextRef} className={s.FloorTextInner}>{ text.length ? text : `${floorIdx + 1}F` }</span>
    </div>
  )
})
