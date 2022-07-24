import { compose, range, remove, sort, uniq } from 'ramda'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getSelectedRange, rangeToFloors } from './utils'

import PointAndText from './components/PointAndText'
import Selected from './components/Selected'
import useMouseDrag from './hooks/useMouseDrag'
import useOffsetWidth from './hooks/useOffsetWidth'
import { SiteSettings } from '../../preferences'

import s from './index.module.css'

type SelectedFloors = number[]
type FloorFilterProps = {
  selectedFloors: SelectedFloors
  totalFloor: number
  siteSettings: SiteSettings
  onChange: (fs: SelectedFloors) => void
}

export default function FloorFilter({
  siteSettings,
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

  const PointAndText_height_ref = useRef<number>(null)


  const [text_height, setTextHeight] = useState(
    PointAndText_height_ref.current || 0
  )

  // eslint-disable-next-line
  useEffect(() => {
    setTextHeight(
      PointAndText_height_ref.current || 0
    )
  })

  return (
    <div
      ref={ref}
      className={`${s.FloorFilter} ${is_dragging ? s.isDragging : ''}`}
      style={{ '--text-height': `${text_height}px` } as CSSProperties}
    >
      <Selected
        startPoint={0}
        endPoint={0}
        intervalWidth={interval_width}
      />

      {getSelectedRange(dragging_selected_floors).map(([start_point, end_point], idx) => {
        return (
          <Selected
            key={idx}
            startPoint={start_point}
            endPoint={end_point}
            intervalWidth={interval_width}
            backgroundColor="transparent"
          />
        )
      })}

      <PointAndText
        ref={PointAndText_height_ref}
        highlightList={dragging_selected_floors}
        textList={
          siteSettings.map(f => {
            return f.name
          })
        }
        floorIndexList={floors}
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
