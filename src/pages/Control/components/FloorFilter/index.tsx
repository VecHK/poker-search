import { range } from 'ramda'
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

import s from './index.module.css'

function PointAndTextLayout({
  points,
  highlightList,
  intervalWidth,
  onMouseDownPoint,
}: {
  points: number[]
  highlightList: number[]
  intervalWidth: Exclude<CSSProperties['width'], undefined>
  onMouseDownPoint: (mouse_start_x: number, point: number) => void
}) {
  function isHighlight(point: number) {
    return highlightList.indexOf(point) !== -1
  }

  return (
    <>
      <div className={s.FloorTextLayout}>
        {points.map(point => {
          return (
            <div
              key={point}
              className={s.FloorText}
              style={{ left: `calc(${point} * ${intervalWidth} - ( var(--text-width) / 2 ))`
            }}>{point + 1}F</div>
          )
        })}
      </div>
      <div className={s.PointLayout}>
        {points.map(point => {
          return (
            <div
              key={point}
              className={`${s.FloorPoint} ${isHighlight(point) ? s.FloorPointHighlight : ''}`}
              style={{ left: `calc(${point} * ${intervalWidth} - ( var(--point-size) / 2 ))`}}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                onMouseDownPoint(e.clientX, point)
              }}
            ></div>
          )
        })}
      </div>
    </>
  )
}

type SelectDirect = 'LEFT' | 'RIGHT'
function Selected({
  dragStartPoint,
  dragEndPoint,
  intervalWidth,
}: {
  dragStartPoint: number
  dragEndPoint: number
  intervalWidth: number
}) {
  const direct = useMemo<SelectDirect>(() => {
    if (dragEndPoint > dragStartPoint) {
      return 'RIGHT'
    } else {
      return 'LEFT'
    }
  }, [dragEndPoint, dragStartPoint])

  const selectedWidth = useMemo(() => {
    const len = Math.abs(dragEndPoint - dragStartPoint)
    return len * intervalWidth
  }, [dragEndPoint, dragStartPoint, intervalWidth])

  const selectedLeft = useMemo(() => {
    if (direct === 'LEFT') {
      return dragEndPoint * intervalWidth
    } else {
      return dragStartPoint * intervalWidth
    }
  }, [direct, dragEndPoint, dragStartPoint, intervalWidth])

  return (
    <div className={s.SelectedContainer}>
      <div
        className={s.Selected}
        style={{
          width: `${selectedWidth}px`,
          left: `${selectedLeft}px`
        }}
      ></div>
    </div>
  )
}

function useOffsetWidth<RefType extends HTMLElement>() {
  const ref = useRef<RefType>(null)
  const [offset_width, setOffsetWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (el) {
      setOffsetWidth(el.offsetWidth)
    }
  }, [])

  return [offset_width, ref] as const
}

function useMouseAction({
  interval_width,
  onClick,
  onDragEnd,
}: {
  interval_width: number
  onClick: (p: number) => void
  onDragEnd: (s: number, e: number) => void
}) {
  const [drag_start_point, setDragStartPoint] = useState(0)
  const [drag_end_point, setDragEndPoint] = useState(0)

  const [mouse_move_start, setMouseMoveStart] = useState<number | null>(null)
  const [mouse_move_offset, setMouseMoveOffset] = useState<number | null>(null)

  useEffect(() => {
    if (mouse_move_start !== null) {
      const handler = (e: MouseEvent) => setMouseMoveOffset( e.clientX - mouse_move_start )
      window.addEventListener('mousemove', handler)
      return () => window.removeEventListener('mousemove', handler)
    }
  }, [mouse_move_start])

  useEffect(() => {
    if (mouse_move_offset !== null) {
      console.log('mouse_move_offset', mouse_move_offset)

      const abs_mouse_move_offset = Math.abs(mouse_move_offset)

      const point_offset = Math.floor(abs_mouse_move_offset / interval_width)
      if (mouse_move_offset > 0) {
        setDragEndPoint(drag_start_point + point_offset)
      } else {
        setDragEndPoint(drag_start_point - point_offset)
      }
    }
  }, [drag_start_point, interval_width, mouse_move_offset])

  useEffect(() => {
    if (mouse_move_start !== null) {
      const handler = (e: MouseEvent) => {
        if (mouse_move_offset === null) {
          // is click
          onClick(drag_start_point)
        } else {
          // submit selected
          console.log('dragend range', drag_start_point, drag_end_point)
          onDragEnd(drag_start_point, drag_end_point)
        }

        // setDragStartPoint(0)
        setDragEndPoint(drag_start_point)
        setMouseMoveStart(null)
        setMouseMoveOffset(null)
      }
      window.addEventListener('mouseup', handler)
      return () => window.removeEventListener('mouseup', handler)
    }
  }, [drag_end_point, drag_start_point, mouse_move_offset, mouse_move_start, onClick, onDragEnd])

  return {
    drag_start_point, setDragStartPoint,
    drag_end_point, setDragEndPoint,
    mouse_move_start, setMouseMoveStart,
    mouse_move_offset, setMouseMoveOffset,
  }
}

type FilteredFloor = number[]
type FloorFilterProps = {
  filteredFloor: FilteredFloor
  totalFloor: number
  onChange: (f: FilteredFloor) => void
}

export default function FloorFilter({
  filteredFloor,
  totalFloor,
  onChange,
}: FloorFilterProps) {
  const [offset_width, ref] = useOffsetWidth<HTMLDivElement>()
  const points = Array.from(Array(totalFloor)).map((_, floor) => floor)
  const interval_width = offset_width / (points.length - 1)
  const interval_width_css: Exclude<CSSProperties['width'], undefined> = useMemo(() => {
    return `${interval_width}px`
  }, [interval_width])

  function compose({
    filteredFloor,
    drag_start_point,
    drag_end_point
  }: {
    filteredFloor: number[]
    drag_start_point: number
    drag_end_point: number
  }) {
    if (drag_end_point < drag_start_point) {
      const tmp = drag_start_point
      drag_start_point = drag_end_point
      drag_end_point = tmp
    }

    const range = drag_end_point - drag_start_point
  }

  useEffect(() => {
    // filteredFloor
  }, [])

  const selectedRange = useMemo<Readonly<[number, number]>>(() => {
    return [0, 0]
  }, [])

  const {
    drag_start_point,
    drag_end_point,
    setMouseMoveStart,
    setDragStartPoint,
    setDragEndPoint,
  } = useMouseAction({
    interval_width,
    onClick(point) {
    },
    onDragEnd(drag_start_point, drag_end_point) {
      if (drag_end_point !== drag_start_point) {
        if (drag_end_point > drag_start_point) {
          onChange([
            ...filteredFloor,
            ...range(drag_start_point, drag_end_point + 1),
          ])
        } else {
          onChange([
            ...filteredFloor,
            ...range(drag_end_point, drag_start_point + 1),
          ])
        }
      }
    },
  })

  return (
    <div ref={ref} className={s.FloorFilter}>
      <Selected
        dragStartPoint={drag_start_point}
        dragEndPoint={drag_end_point}
        intervalWidth={interval_width}
      />

      <PointAndTextLayout
        highlightList={filteredFloor}
        points={points}
        intervalWidth={interval_width_css}
        onMouseDownPoint={(mouse_start, point) => {
          setMouseMoveStart(mouse_start)
          setDragStartPoint(point)
          setDragEndPoint(point)
        }}
      />
    </div>
  )
}
