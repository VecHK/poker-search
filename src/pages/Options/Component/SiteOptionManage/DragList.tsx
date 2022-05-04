import React, { useCallback, useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggingStyle,
  NotDraggingStyle,
  DraggableLocation
} from 'react-beautiful-dnd'

import s from './DragList.module.css'

// fake data generator
const getItems = (count: number, offset = 0): Item[] =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `item-${k + offset}-${new Date().getTime()}`,
    content: `item ${k + offset}`
  }));

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

type Item = {
  id: string
  content: string
}

const move = (
  source: Item[],
  destination: Item[],
  droppableSource: DraggableLocation,
  droppableDestination: DraggableLocation,
) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  // const result = {};
  // result[droppableSource.droppableId] = sourceClone;
  // result[droppableDestination.droppableId] = destClone;

  // return result;
  return [sourceClone, destClone] as const
};

const grid = 8;

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined
): React.CSSProperties => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  // padding: `${grid * 2}px 0`,
  // margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? "lightgreen" : "",

  // styles we need to apply on draggables
  ...draggableStyle
});

const getListStyle = (isDraggingOver: boolean) => ({
  // background: isDraggingOver ? "lightblue" : "lightgrey",
  // padding: 0,
  // width: 250
});

export default function DragList() {
  const [state, setState] = useState([getItems(10), getItems(5, 10)]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }
    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(state[sInd], source.index, destination.index);
      const newState = [...state];
      newState[sInd] = items;
      setState(newState);
    } else {
      const [s, d] = move(state[sInd], state[dInd], source, destination);
      const newState = [...state];
      // newState[sInd] = result[sInd];
      // newState[dInd] = result[dInd];

      newState[sInd] = s;
      newState[dInd] = d;

      setState(newState.filter(group => group.length));
    }
  }, [state])

  return (
    <div>
      {/* <button
        type="button"
        onClick={() => {
          setState([...state, []]);
        }}
      >
        Add new group
      </button>
      <button
        type="button"
        onClick={() => {
          setState([...state, getItems(1)]);
        }}
      >
        Add new item
      </button> */}
      <div style={{}}>
        <DragDropContext onDragEnd={onDragEnd}>
          {state.map((el, ind) => (
            <Droppable key={ind} droppableId={`${ind}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  className={s.Row}
                  style={{
                    ...getListStyle(snapshot.isDraggingOver),
                    padding: '10px 0px'
                  }}
                  {...provided.droppableProps}
                >
                  <div className={s.FloorInfo}>
                    <div className={s.Floor}>{ind + 1}F</div>
                    {ind === 0 ? <div className={s.FirstFloorDesc}>使用Poker后，最先展示的层</div> : null }
                  </div>
                  {el.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                        >
                          <div
                            className={s.Col}
                          >
                            <div className={s.Handler}>
                              <div className={s.HandlerLine}></div>
                              <div className={s.HandlerLine}></div>
                              <div className={s.HandlerLine}></div>
                            </div>
                            {/* <div className={s.Num}>{index + 1}</div> */}
                            <div className={s.Icon}></div>
                            <div className={s.UrlPattern}>UrlPattern-{item.content}</div>

                            <div className={s.ButtonGroup}>
                              {/* <button className={s.Button}>+</button> */}
                              <button
                                className={s.Button}
                                type="button"
                                onClick={() => {
                                  const newState = [...state];
                                  newState[ind].splice(index, 1);
                                  setState(
                                    newState.filter(group => group.length)
                                  );
                                }}
                              >
                                -
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <div
                    className={s.Col}
                  >
                    <div className={s.Handler}>
                      <div className={s.HandlerLine}></div>
                      <div className={s.HandlerLine}></div>
                      <div className={s.HandlerLine}></div>
                    </div>
                    {/* <div className={s.Num}>{el.length + 1}</div> */}
                    <div className={s.Icon}></div>
                    <div className={s.UrlPattern}>输入 UrlPattern</div>

                    <div className={s.ButtonGroup}>
                      {/* <button className={s.Button}>+</button> */}
                      <button
                        className={s.Button}
                        type="button"
                        style={{ opacity: 1 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}
