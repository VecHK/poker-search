import { curry, equals, remove } from 'ramda'
import React, { useContext, useMemo, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'

import { SiteOption, SiteSettingFloor } from '../../../../preferences/site-settings'
import { generateExampleOption } from '../../../../preferences/default'

import SiteWindow from './SiteWindow'
import { Edit, ManagerContext } from '.'
import AddSiteOption from './AddSiteOption'

import useMaxWindowPerLine from '../../../../hooks/useMaxWindowPerLine'

import s from './DragCols.module.css'

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
  settingFloor: SiteSettingFloor
  option: SiteOption
  isEditMode: boolean
  edit: Edit
  colNum: number
  // rowNum: number
  onClickRemove(colNum: number): void
}) {
  const { updateOne, setEdit } = useContext(ManagerContext)
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
              siteOption={props.option}
              isEdit={isEdit}
              isBlur={props.isEditMode && !isEdit}
              onCancelEdit={() => setEdit(null)}
              onClickEdit={() => setEdit(props.option.id)}
              onClickRemove={() => props.onClickRemove(colNum)}
              onChange={curry(updateOne)(props.option.id)}
              onSubmit={(newOption) => {
                updateOne(newOption.id, newOption)
                setEdit(null)
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
  settingFloor: SiteSettingFloor
  isEditMode: boolean
  edit: Edit
  // rowNum: number,
  onClickRemove(colNum: number): void
  onRemoveAnimationEnd(): void
}) {
  const renderDragItem = (option: SiteOption, colNum: number) => {
    return (
      <SiteOptionDragItem
        key={option.id}
        option={option}
        settingFloor={props.settingFloor}
        isEditMode={props.isEditMode}
        edit={props.edit}
        colNum={colNum}
        // rowNum={props.rowNum}
        onClickRemove={props.onClickRemove}
      />
    )
  }

  if (props.enableRemoveAnimation) {
    return (
      <TransitionGroup
        className={s.SiteOptionList}
      >
        {props.settingFloor.row.map((col, colNum) => (
          <CSSTransition
            key={col.id}
            onExited={props.onRemoveAnimationEnd}
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
            {renderDragItem(col, colNum)}
          </CSSTransition>
        ))}
      </TransitionGroup>
    )
  } else {
    return <>
      {props.settingFloor.row.map(renderDragItem)}
    </>
  }
}

export default function Cols(props: {
  rowNum: number,
  settingFloor: SiteSettingFloor,
  edit: Edit
  isEditMode: boolean
}) {
  const { appendSiteOption, updateFloor, adjustWidth, limit } = useContext(ManagerContext)
  const [enableRemoveAnimation, setEnableRemoveAnimation] = useState(false)
  const { settingFloor, rowNum } = props

  const maxWindowPerLine = useMaxWindowPerLine(limit)
  const showAddButton = settingFloor.row.length < maxWindowPerLine
  const addSiteIcon = useMemo(() => {
    return (
      <AddSiteOption
        show={showAddButton}
        disable={props.isEditMode}
        onClickAdd={() => {
          appendSiteOption(settingFloor.id, generateExampleOption())
        }}
        onEntered={() => adjustWidth(500)}
        onExited={() => adjustWidth(500)}
      />
    )
  }, [adjustWidth, appendSiteOption, props.isEditMode, settingFloor.id, showAddButton])

  return (
    <Droppable droppableId={`${rowNum}`} type="COLS" direction="horizontal">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getColListStyle(snapshot.isDraggingOver)}
        >
          <SiteOptionList
            settingFloor={settingFloor}
            edit={props.edit}
            isEditMode={props.isEditMode}
            enableRemoveAnimation={enableRemoveAnimation}
            onRemoveAnimationEnd={() => setEnableRemoveAnimation(false)}
            onClickRemove={(colNum) => {
              setEnableRemoveAnimation(true)
              setTimeout(() => {
                updateFloor(settingFloor.id, {
                  ...settingFloor,
                  row: remove(colNum, 1, settingFloor.row)
                })
              })
            }}
          />

          {provided.placeholder}

          {addSiteIcon}
        </div>
      )}
    </Droppable>
  )
}
