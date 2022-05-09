import { equals } from 'ramda'
import React from 'react'
import { Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { SiteOption, SiteRow } from '../../../../options/site-matrix'
import s from './DragCols.module.css'
import SiteWindow from './SiteWindow'

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined
): React.CSSProperties => {
  return {
    userSelect: "none",
    textAlign: "right",
    // background: isDragging ? "lightgreen" : "",
    ...draggableStyle
  }
}

export const getColListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
  display: "flex",
  flexGrow: 2,
  // background: isDraggingOver ? "lightblue" : "",
  // padding: 4,
  // width: 350
})

type Pos = null | Readonly<[number, number]>

export default function Cols(props: {
  rowNum: number,
  row: SiteRow,
  edit: Pos
  isEditMode: boolean
  onCancelEdit(): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
}) {
  const { row, rowNum } = props

  return (
    <Droppable droppableId={`${rowNum}`} type="COLS" direction="horizontal">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getColListStyle(snapshot.isDraggingOver)}
        >
          {row.map((col, colNum) => {
            return (
              <Draggable
                key={`${col.id}`}
                draggableId={`${col.id}`}
                index={colNum}
                isDragDisabled={Boolean(props.edit)}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={s.ColDnDFrame}
                    style={getItemStyle(
                      snapshot.isDragging,
                      provided.draggableProps.style
                    )}
                  >
                    <SiteWindow
                      isEdit={equals(props.edit, [props.rowNum, colNum])}
                      isBlur={props.isEditMode && !equals(props.edit, [props.rowNum, colNum])}
                      onCancelEdit={props.onCancelEdit}
                      siteOption={col}
                      onSubmit={(newOption) => {
                        props.onSubmitEdit(colNum, newOption)
                      }}
                      onClickEdit={() => {
                        props.onClickEdit(colNum)
                      }}
                      onClickRemove={() => {
                        props.onClickRemove(colNum)
                      }}
                    />
                  </div>
                )}
              </Draggable>
            )
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
