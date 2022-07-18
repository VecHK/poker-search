import { compose, range, remove, sort, uniq } from 'ramda'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import s from './index.module.css'

function incrementDetecting(p: number, filtered: number[]): number[] {
  if (filtered.indexOf(p) !== -1) {
    return [p, ...incrementDetecting(p + 1, filtered)]
  } else {
    return []
  }
}

type Range = Readonly<[number, number]>

function getSelectedRange(selected_index_list: number[]): Array<Range> {
  let result: Array<Range> = []
  let pass: number[] = []

  selected_index_list.forEach((point, idx) => {
    if (pass.indexOf(idx) === -1) {
      const detected = incrementDetecting(point, selected_index_list)
      pass = [...pass, ...detected.map((p) => selected_index_list.indexOf(p))]

      result.push(
        [ Math.min(...detected),  Math.max(...detected) ] as const
      )
    }
  })

  return result
}

function rangeToFloors([start, end]: Range) {
  if (Math.abs(end - start) === 0) {
    return [start]
  } else {
    if (end > start) {
      return range(start, end + 1)
    } else {
      return range(end, start + 1)
    }
  }
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

function useMouseDrag({
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

    is_dragging: mouse_move_start !== null
  }
}

function PointAndText({
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

type SelectDirect = 'LEFT' | 'RIGHT'
function Selected({
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
    <div className={s.SelectedContainer} style={{ backgroundColor }}>
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

type SelectedFloors = number[]
type FloorFilterProps = {
  selectedFloors: SelectedFloors
  totalFloor: number
  onChange: (fs: SelectedFloors) => void
}

export default function FloorFilter({
  selectedFloors,
  totalFloor,
  onChange,
}: FloorFilterProps) {
  const [offset_width, ref] = useOffsetWidth<HTMLDivElement>()
  const floors = range(0, totalFloor)
  const interval_width = offset_width / (floors.length - 1)
  const interval_width_css: Exclude<CSSProperties['width'], undefined> = useMemo(() => {
    return `${interval_width}px`
  }, [interval_width])

  const formatFloors = compose<[number[]], number[], number[]>(
    sort((a, b) => a - b),
    uniq
  )

  const submitChange = compose<[number[]], number[], void>(
    onChange,
    formatFloors
  )

  function isSelected(floor: number) {
    return selectedFloors.indexOf(floor) !== -1
  }

  const [select_mode, setSelectMode] = useState<'SELECTED' | 'NORMAL'>('NORMAL')
  useEffect(() => {
    console.log('selectedFloors', [...selectedFloors])
    setSelectMode('NORMAL')
  }, [selectedFloors])

  const {
    is_dragging,
    drag_start_point,
    drag_end_point,
    setMouseMoveStart,
    setDragStartPoint,
    setDragEndPoint,
  } = useMouseDrag({
    interval_width,

    onClick(point) {
      console.log('onClick', point, select_mode)

      if (select_mode === 'SELECTED') {
        submitChange(
          remove(selectedFloors.indexOf(point), 1, selectedFloors)
        )
      } else {
        submitChange([ ...selectedFloors, point ])
      }
    },

    onDragEnd(drag_start_point, drag_end_point) {
      console.log('onDragEnd', drag_start_point, drag_end_point)
      if (Math.abs(drag_end_point - drag_start_point) !== 0) {
        submitChange(
          getDraggingSelectedFloors(drag_start_point, drag_end_point)
        )
      }
    },
  })

  const getDraggingSelectedFloors = useCallback((
    drag_start: number,
    drag_end: number
  ) => {
    const selected = rangeToFloors([drag_start, drag_end])
    console.log('selected', selected)

    if (select_mode === 'NORMAL') {
      return formatFloors([...selectedFloors, ...selected])
    } else {
      const res: number[] = []
      selectedFloors.forEach((f) => {
        if (selected.indexOf(f) === -1) {
          res.push(f)
        }
      })
      return res
    }
  }, [selectedFloors, formatFloors, select_mode])

  const dragging_selected_floors = useMemo(() => {
    if (!is_dragging) {
      return selectedFloors
    } else {
      return getDraggingSelectedFloors(drag_start_point, drag_end_point)
    }
  }, [drag_end_point, drag_start_point, selectedFloors, getDraggingSelectedFloors, is_dragging])

  return (
    <div ref={ref} className={`${s.FloorFilter} ${is_dragging ? s.isDragging : ''}`}>
      <Selected
        dragStartPoint={0}
        dragEndPoint={0}
        intervalWidth={interval_width}
      />

      {getSelectedRange(dragging_selected_floors).map(([start_point, end_point], idx) => {
        return (
          <Selected
            key={idx}
            dragStartPoint={start_point}
            dragEndPoint={end_point}
            intervalWidth={interval_width}
            backgroundColor="transparent"
          />
        )
      })}

      <PointAndText
        highlightList={dragging_selected_floors}
        floors={floors}
        intervalWidth={interval_width_css}
        onMouseDownPoint={(mouse_start, floor) => {
          if (isSelected(floor)) {
            setSelectMode('SELECTED')
          }

          setMouseMoveStart(mouse_start)
          setDragStartPoint(floor)
          setDragEndPoint(floor)
        }}
      />
    </div>
  )
}
