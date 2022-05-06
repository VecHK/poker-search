import React from "react";
import { Droppable, Draggable, DraggingStyle, NotDraggingStyle } from "react-beautiful-dnd";
import { SiteOption, SiteRow } from "../../../../options/site-matrix";
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
  };
};

export const getColListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
  display: "flex",
  flexGrow: 2,
  // background: isDraggingOver ? "lightblue" : "",
  padding: 4,
  // width: 350
});

function urlToDomain(url: string): string {
  const u = new URL(url)
  return u.hostname
}

function Col(
  { siteOption, onClickRemove }: { siteOption: SiteOption; onClickRemove(): void }
) {
  return (
    <div className={s.Col}>
      {/* <div className={s.Handler}>
        <div className={s.HandlerLine}></div>
        <div className={s.HandlerLine}></div>
        <div className={s.HandlerLine}></div>
      </div> */}
      {/* <div className={s.Num}>{index + 1}</div> */}
      <div className={s.Above}>
        <div className={s.Icon}></div>
        {/* <div className={s.UrlPattern}>{str}</div> */}
        <div className={s.UrlPattern}>{urlToDomain(siteOption.url_pattern)}</div>
      </div>
      <div className={s.Bottom}>
        <div className={s.ButtonGroup}>
          {/* <button className={s.Button}>+</button> */}
          <button
            className={s.Button}
            type="button"
            onClick={() => {
              onClickRemove()
            }}
          >
            -
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cols(props: {
  rowNum: number,
  row: SiteRow,
  onClickRemove(colNum: number): void
}) {
  const { row, rowNum } = props;
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
                    <Col
                      siteOption={col}
                      onClickRemove={() => {
                        props.onClickRemove(colNum)
                      }}
                    />
                  </div>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
