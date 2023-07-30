import { multiply } from 'ramda'
import React, { CSSProperties, forwardRef, ReactNode, useEffect, useMemo, useRef } from 'react'
import useOffsetWidth from '../hooks/useOffsetWidth'
import s from './PointAndText.module.css'

export function FloorPoint({ isHighlight, ...rest }: {
  isHighlight: boolean
} & React.DOMAttributes<HTMLDivElement>) {
  return (
    <div
      className={`${s.FloorPoint} ${isHighlight ? s.FloorPointHighlight : ''}`}
      { ...rest }
    ></div>
  )
}

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
              className={`${s.FloorPointWrap}`}
              style={{ left: `calc(${floor_idx} * ${intervalWidth} - ( var(--point-size) / 2 ))`}}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                onMouseDownPoint(e.clientX, floor_idx)
              }}
            >
              <FloorPoint isHighlight={isHighlight(floor_idx)} />
            </div>
          )
        })}
      </div>
    </>
  )
})

const FLOOR_TEXT_ANGLE = 35
const ONE_DEG_RADIUS = Math.PI / 180
const toRAD = multiply(ONE_DEG_RADIUS)
const calcFloorTextHeight = (angle: number, len: number) => Math.sin(toRAD(angle)) * len

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

  const height = useMemo(() => (
    // 正确地计算出 FloorText 最顶点和最低点的高度差
    // 原本只需要获取 offsetHeight 就可以得到的，
    // 但此时这里的元素是有旋转角度的，因此并不准确
    calcFloorTextHeight(FLOOR_TEXT_ANGLE, offset_width)
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
      className={`${s.FloorText}`}
      style={{
        left: `calc(${floorIdx} * ${intervalWidth} - ( var(--text-width) / 2 ))`,
        '--deg': `${FLOOR_TEXT_ANGLE}deg`,
        '--interval-top': `${interval_top}px`
      } as CSSProperties}
    >
      {/* <div className={s.Height} style={{ height: `${height}px` }}></div> */}
      <span
        ref={innerTextRef}
        className={`${s.FloorTextInner} ${highlight ? s.FloorTextHighlight : ''}`}
      >
        <FloorLabel>
          {floorName(floorIdx, text)}
        </FloorLabel>
      </span>
    </div>
  )
})

export function floorName(floor_idx:number, text: string | undefined) {
  return text?.length ? text : `${floor_idx + 1}F`
}

export function FloorLabel({
  children
}: { children?: ReactNode }) {
  return <span className={s.FloorLabel}>{ children }</span>
}
