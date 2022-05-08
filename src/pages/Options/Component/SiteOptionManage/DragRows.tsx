import { all, equals, insert, move, nth, remove, update } from 'ramda'
import React from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggingStyle,
  NotDraggingStyle,
  DraggableLocation,
  SensorAPI
} from 'react-beautiful-dnd'
import Cols from './DragCols'
import { SiteMatrix } from '../../../../options/site-matrix'
import SettingItem from '../SettingItem'
import s from './DragRows.module.css'
import WarningLine from './WarningLine'

const getRowListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
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
  siteMatrix: SiteMatrix,
  source: DraggableLocation,
  destination: DraggableLocation,
): SiteMatrix {
  const sRowNum = Number(source.droppableId)
  const dRowNum = Number(destination.droppableId)
  const sRow = nth(sRowNum, siteMatrix)
  const dRow = nth(dRowNum, siteMatrix)
  const sColNum = source.index
  const dColNum = destination.index

  if (!sRow || !dRow) {
    throw Error('sRow || dRow not found!')
  } else if (sRowNum === dRowNum) {
    const newRow = move(sColNum, dColNum, sRow)
    return update(sRowNum, newRow, siteMatrix)
  } else {
    const sCol = nth(sColNum, sRow)
    if (!sCol) {
      throw Error('sCol not found!')
    } else {
      const dRowNew = insert(dColNum, sCol, dRow)
      const sRowNew = remove(sColNum, 1, sRow)
  
      const newMatrix = update(dRowNum, dRowNew, siteMatrix)
      return update(sRowNum, sRowNew, newMatrix)
    }
  }
}

const ROW_DRAP = 'ROW_DRAP'
function isRowDrap(...ids: string[]): boolean {
  return all(equals(ROW_DRAP))(ids)
}

function reorderRows(
  siteMatrix: SiteMatrix,
  source: DraggableLocation,
  destination: DraggableLocation,
): SiteMatrix {
  if (!isRowDrap(source.droppableId, destination.droppableId)) {
    throw new Error('current drap is not ROW_DRAP')
  } else {
    const sRowNum = Number(source.index)
    const dRowNum = Number(destination.index)
    return move(sRowNum, dRowNum, siteMatrix)
  }
}

type Pos = Readonly<[number, number]>

type DragMatrixProps = {
  edit: Pos | null,
  setEdit: React.Dispatch<React.SetStateAction<Pos | null>>
  siteMatrix: SiteMatrix
  onChange: (s: SiteMatrix) => void
}
export default function DragRows({
  edit,
  setEdit,
  siteMatrix,
  onChange
}: DragMatrixProps) {
  const onDragEnd = ({ type, source, destination }: DropResult) => {
    if (!destination) {
      // no change
    } else if (type === "ROWS") {
      const newMatrix = reorderRows(siteMatrix, source, destination)
      onChange(newMatrix)
    } else if (type === 'COLS') {
      const newMatrix = reorderCols(siteMatrix, source, destination)
      onChange(newMatrix)
    } else {
      throw Error('unknown result.type')
    }
  }

  function useMyCoolSensor(api: SensorAPI) {
    Object.assign(window, { api })
  }

  return (
    <div className={s.DragRows}>
      <DragDropContext onDragEnd={onDragEnd} sensors={[useMyCoolSensor]}>
        <div className={s.DragDropContextInner}>
          <Droppable droppableId={ROW_DRAP} type="ROWS">
            {(provided, rowSnapshot) => (
              <div
                ref={provided.innerRef}
                style={getRowListStyle(rowSnapshot.isDraggingOver)}
              >
                {siteMatrix.map((row, rowNum) => (
                  <Draggable key={rowNum} draggableId={`${rowNum}`} index={rowNum} isDragDisabled={Boolean(edit)}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={s.DragRowDnD}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                      >
                        <SettingItem className={s.RowSettingItem} disableMargin>
                          <div className={s.DragRowInner}>
                            <div {...provided.dragHandleProps}>
                              <div className={s.Handler}>
                                <div className={s.HandlerLine}></div>
                                <div className={s.HandlerLine}></div>
                                <div className={s.HandlerLine}></div>
                              </div>
                            </div>
                            <Cols
                              rowNum={rowNum}
                              row={row}
                              edit={edit}
                              isEditMode={Boolean(edit)}
                              onSubmitEdit={(colNum, newOption) => {
                                const newRow = update(colNum, newOption, row)
                                const newMatrix = update(rowNum, newRow, siteMatrix)
                                onChange(newMatrix)
                                setEdit(null)
                              }}
                              onClickEdit={(colNum) => {
                                console.log('onClickEdit')
                                setEdit([rowNum, colNum])
                              }}
                              onCancelEdit={() => {
                                setEdit(null)
                              }}
                              onClickRemove={(colNum) => {
                                const newRow = remove(colNum, 1, row)
                                const newMatrix = update(rowNum, newRow, siteMatrix)
                                onChange(newMatrix)
                              }}
                            />
                          </div>
                          <div className={`${s.Floor} ${rowSnapshot.isDraggingOver ? s.isDraggingOver : ''}`}>{siteMatrix.length - (rowNum + 1) + 1}F</div>
                        </SettingItem>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <WarningLine siteMatrix={siteMatrix} />
        </div>
      </DragDropContext>
      <div className={s._1FTips}>⬆ 使用 Poker 后，最先展示的层</div>
    </div>
  )
}
