import { all, compose, equals, insert, move, nth, remove, update } from 'ramda'
import React, { useContext } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggingStyle,
  NotDraggingStyle,
  DraggableLocation
} from 'react-beautiful-dnd'

import { SiteSettings } from '../../../../preferences/site-settings'
import SettingItem from '../SettingItem'
import WarningLine from './WarningLine'
import Cols from './DragCols'
import { ManagerContext } from '.'

import useMaxWindowPerLine from '../../../../hooks/useMaxWindowPerLine'

import s from './DragFloors.module.css'
import TransitionList from './TransitionList'

export const FLOOR_TRANSITION_DURATION = 382

const getFloorListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
  // background: isDraggingOver ? "lightblue" : "lightgrey",
  // padding: 8,
  // width: "480px"
})

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined
): React.CSSProperties => {
  return {
    userSelect: "none",
    // margin: `0 0 ${grid}px 0`,
    // margin: 0,

    background: isDragging ? "lightgreen" : "",

    ...draggableStyle
  }
}

function reorderCols(
  site_settings: SiteSettings,
  source: DraggableLocation,
  destination: DraggableLocation,
): SiteSettings {
  const s_row = Number(source.droppableId)
  const d_row = Number(destination.droppableId)
  const row_src = nth(s_row, site_settings)
  const row_des = nth(d_row, site_settings)

  const s_col = source.index
  const d_col = destination.index

  if ((row_src === undefined) || (row_des === undefined)) {
    throw Error('row_src/row_des not found!')
  }
  else if (s_row === d_row) {
    const new_row = move(s_col, d_col, row_src.row)
    return update(s_row, { ...row_src, row: new_row }, site_settings)
  }
  else {
    const col_src = nth(s_col, row_src.row)
    if (col_src === undefined) {
      throw Error('col_src not found')
    } else {
      return compose(
        update(s_row, { ...row_src, row: remove(s_col, 1, row_src.row) }),
        update(d_row, { ...row_des, row: insert(d_col, col_src, row_des.row) }),
      )(site_settings)
    }
  }
}

const FLOOR_DROP = 'FLOOR_DROP'
const isFloorDrop = all(equals(FLOOR_DROP))

function reorderFloors(
  site_settings: SiteSettings,
  source: DraggableLocation,
  destination: DraggableLocation,
): SiteSettings {
  if (!isFloorDrop([source.droppableId, destination.droppableId])) {
    throw new Error(`current drop is not ${FLOOR_DROP}`)
  } else {
    const s_floor_idx = Number(source.index)
    const d_floor_idx = Number(destination.index)
    return move(s_floor_idx, d_floor_idx, site_settings)
  }
}

export default function DragFloors() {
  const {
    siteSettings,
    edit,
    submitChange,
    limit,
  } = useContext(ManagerContext)

  const onDragEnd = ({ type, source, destination }: DropResult) => {
    if (!destination) {
      // no change
    } else if (type === 'FLOORS') {
      submitChange(
        reorderFloors(siteSettings, source, destination)
      )
    } else if (type === 'COLS') {
      submitChange(
        reorderCols(siteSettings, source, destination)
      )
    } else {
      throw Error('unknown result.type')
    }
  }

  function handleDragUpdate(...args: any[]) {
    console.log(...args)
  }

  const maxWindowPerLine = useMaxWindowPerLine(limit)
  const hasMaxCol = !siteSettings.every((f) => {
    if (maxWindowPerLine === -1) {
      return false
    } else {
      return f.row.length <= maxWindowPerLine
    }
  })

  const list_item_margin_bottom = 12

  return (
    <div className={s.DragFloors}>
      <DragDropContext
        onDragEnd={onDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <div className={s.DragDropContextInner}>
          <Droppable droppableId={FLOOR_DROP} type="FLOORS">
            {(provided, floor_snapshot) => (
              <div
                ref={provided.innerRef}
                style={getFloorListStyle(floor_snapshot.isDraggingOver)}
              >
                <TransitionList
                  duration={FLOOR_TRANSITION_DURATION}
                  marginBottom={list_item_margin_bottom}
                  nodes={
                    siteSettings.map((setting_floor, floor_row) => ({
                      id: setting_floor.id,
                      node: (
                        <Draggable
                          key={setting_floor.id}
                          draggableId={setting_floor.id}
                          index={floor_row}
                          isDragDisabled={Boolean(edit)}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={s.DragFloorDnD}
                              style={{
                                ...getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                ),
                                marginBottom: `${list_item_margin_bottom}px`,
                              }}
                            >
                              <SettingItem className={s.FloorSettingItem} disableMargin>
                                <input
                                  value={setting_floor.name}
                                  onChange={(el) => {
                                    el.preventDefault()
                                    const new_name = el.target.value
                                    submitChange(
                                      update(floor_row, {
                                        ...setting_floor,
                                        name: new_name
                                      }, siteSettings)
                                    )
                                  }}
                                />
                                <div className={s.DragFloorInner}>
                                  <div {...provided.dragHandleProps}>
                                    <div className={s.Handler}>
                                      <div className={s.HandlerLine}></div>
                                      <div className={s.HandlerLine}></div>
                                      <div className={s.HandlerLine}></div>
                                    </div>
                                  </div>
                                  <Cols
                                    rowNum={floor_row}
                                    settingFloor={setting_floor}
                                    edit={edit}
                                    isEditMode={edit !== null}
                                  />
                                </div>
                                {/* <div className={`${s.Floor} ${floor_snapshot.isDraggingOver ? s.isDraggingOver : ''}`}>{siteSettings.length - (floor_row + 1) + 1}F</div> */}
                              </SettingItem>
                            </div>
                          )}
                        </Draggable>
                      )
                    }))
                  }
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <WarningLine
            disable={Boolean(edit) || !hasMaxCol}
            maxWindowPerLine={maxWindowPerLine}
          />
        </div>
      </DragDropContext>
      <div className={s._1FTips}>⬆ 使用 Poker 后，最先展示的层</div>
    </div>
  )
}
