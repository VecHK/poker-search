import { equals } from 'ramda'
import React, { useMemo, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'

import { SiteOption, SiteSettingsRow } from '../../../../preferences/site-settings'
import SiteWindow from './SiteWindow'

import s from './DragCols.module.css'

import AddSiteOption from './AddSiteOption'
import { useMaxWindowPerLine } from './WarningLine'
import { Edit } from '.'

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

function SiteOptionDragItem(props: {
  option: SiteOption
  isEditMode: boolean
  edit: Edit
  colNum: number
  rowNum: number
  onCancelEdit(): void
  onChange(id: SiteOption['id'], s: SiteOption): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
}) {
  const { colNum } = props
  const isEdit = equals(props.edit, props.option.id)
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
              isEdit={isEdit}
              isBlur={props.isEditMode && !isEdit}
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
  settingsRow: SiteSettingsRow
  isEditMode: boolean
  edit: Edit
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
        {props.settingsRow.row.map((col, colNum) => (
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
      {props.settingsRow.row.map((col, colNum) => (
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
  settingsRow: SiteSettingsRow,
  edit: Edit
  isEditMode: boolean
  onCancelEdit(): void
  onChange(id: SiteOption['id'], s: SiteOption): void
  onClickAdd(): void
  onSubmitEdit(colNum: number, s: SiteOption): void
  onClickEdit(colNum: number): void
  onClickRemove(colNum: number): void
}) {
  const [enableRemoveAnimation, setEnableRemoveAnimation] = useState(false)
  const { settingsRow, rowNum } = props

  const maxWindowPerLine = useMaxWindowPerLine()
  const showAddButton = useMemo(() => {
    if (maxWindowPerLine === null) {
      return true
    } else {
      return settingsRow.row.length < maxWindowPerLine
    }
  }, [maxWindowPerLine, settingsRow.row.length])

  return (
    <Droppable droppableId={`${rowNum}`} type="COLS" direction="horizontal">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getColListStyle(snapshot.isDraggingOver)}
        >
          <SiteOptionList
            enableRemoveAnimation={enableRemoveAnimation}
            settingsRow={settingsRow}
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

          <AddSiteOption
            show={showAddButton}
            disable={props.isEditMode}
            onClickAdd={props.onClickAdd}
          />
        </div>
      )}
    </Droppable>
  )
}
