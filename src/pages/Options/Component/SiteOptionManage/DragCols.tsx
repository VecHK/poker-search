import { equals } from 'ramda'
import React, { useState } from 'react'
import { Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { SiteOption, SiteRow } from '../../../../options/site-matrix'
import s from './DragCols.module.css'
import SiteWindow, { SiteWindowFrame } from './SiteWindow'
import plusSrc from './plus.svg'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

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

function SiteOptionDragItem(props: {
  option: SiteOption
  isEditMode: boolean
  edit: Pos
  colNum: number
  rowNum: number
  onCancelEdit(): void
  onChange(id: SiteOption['id'], s: SiteOption): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
}) {
  const { rowNum, colNum } = props
  return (
    <div className={s.SiteOption}>
      <Draggable
        key={`${props.option.id}`}
        draggableId={`${props.option.id}`}
        index={props.colNum}
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
              isEdit={equals(props.edit, [rowNum, colNum])}
              isBlur={props.isEditMode && !equals(props.edit, [rowNum, colNum])}
              onCancelEdit={props.onCancelEdit}
              siteOption={props.option}
              onChange={props.onChange}
              onSubmit={(newOption) => {
                props.onSubmitEdit(colNum, newOption)
              }}
              onClickEdit={() => {
                console.log('inner onClickEdit')
                props.onClickEdit(colNum)
              }}
              onClickRemove={() => {
                props.onClickRemove(colNum)
              }}
            />
          </div>
        )}
      </Draggable>
    </div>
  )
}

function SiteOptionList(props: {
  enableRemoveAnimation: boolean
  cols: SiteOption[]
  isEditMode: boolean
  edit: Pos
  rowNum: number,
  onCancelEdit(): void
  onChange(id: SiteOption['id'], s: SiteOption): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
  onRemoveAnimationEnd(): void
}) {
  if (props.enableRemoveAnimation) {
    return (
      <TransitionGroup
        className={s.SiteOptionList}
      >
        {props.cols.map((col, colNum) => (
          <CSSTransition
            onExited={props.onRemoveAnimationEnd}
            key={col.id}
            timeout={382}
            classNames={{
              enter: s.SiteOptionEnter,
              enterActive: s.SiteOptionEnterActive,
              enterDone: s.SiteOptionEnterDone,
              exit: s.SiteOptionExit,
              exitActive: s.SiteOptionExitActive,
              exitDone: s.SiteOptionExitDone,
            }}
          >
            <SiteOptionDragItem
              option={col}
              isEditMode={props.isEditMode}
              edit={props.edit}
              colNum={colNum}
              rowNum={props.rowNum}
              onCancelEdit={props.onCancelEdit}
              onChange={props.onChange}
              onSubmitEdit={props.onSubmitEdit}
              onClickEdit={props.onClickEdit}
              onClickRemove={props.onClickRemove}
            />
          </CSSTransition>
        ))}
      </TransitionGroup>
    )
  } else {
    return <>
      {props.cols.map((col, colNum) => (
        <SiteOptionDragItem
          key={col.id}
          option={col}
          isEditMode={props.isEditMode}
          edit={props.edit}
          colNum={colNum}
          rowNum={props.rowNum}
          onCancelEdit={props.onCancelEdit}
          onChange={props.onChange}
          onSubmitEdit={props.onSubmitEdit}
          onClickEdit={props.onClickEdit}
          onClickRemove={props.onClickRemove}
        />
      ))}
    </>
  }
}

export default function Cols(props: {
  rowNum: number,
  row: SiteRow,
  edit: Pos
  isEditMode: boolean
  onCancelEdit(): void
  onChange(id: SiteOption['id'], s: SiteOption): void
  onClickAdd(): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
}) {
  const [enableRemoveAnimation, setEnableRemoveAnimation] = useState(false)
  const { row, rowNum } = props

  return (
    <Droppable droppableId={`${rowNum}`} type="COLS" direction="horizontal">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getColListStyle(snapshot.isDraggingOver)}
        >
          <SiteOptionList
            enableRemoveAnimation={enableRemoveAnimation}
            cols={row}
            isEditMode={props.isEditMode}
            edit={props.edit}
            rowNum={rowNum}
            onCancelEdit={props.onCancelEdit}
            onChange={props.onChange}
            onSubmitEdit={props.onSubmitEdit}
            onClickEdit={props.onClickEdit}
            onRemoveAnimationEnd={() => setEnableRemoveAnimation(false)}
            onClickRemove={(colNum) => {
              setEnableRemoveAnimation(true)
              setTimeout(() => props.onClickRemove(colNum))
            }}
          />

          {provided.placeholder}

          <div style={{ margin: '0 8px' }}>
            <SiteWindowFrame>
              <img
                className={s.AddSite}
                src={plusSrc}
                style={{ cursor: 'pointer', width: '48px', height: '48px' }}
                alt="add site option"
                onClick={props.onClickAdd}
              />
            </SiteWindowFrame>
          </div>
        </div>
      )}
    </Droppable>
  )
}
