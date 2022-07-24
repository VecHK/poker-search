import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import s from './TransitionList.module.css'

function useListOffsetHeight<RefType extends HTMLElement>(
  length: number
) {
  const blanks = Array.from(Array(length)).map(() => undefined)
  const refs = useRef<Array<RefType | undefined>>(blanks)
  const [height_list, setOffsetHightList] = useState<number[]>([])

  useEffect(() => {
    const els = refs.current

    setOffsetHightList(
      els.map((el) => {
        if (el === undefined) {
          return 0
        } else {
          return el.offsetHeight
        }
      })
    )
  }, [])

  return [height_list, refs] as const
}

export default function TransitionList({
  nodes,
  duration,
  marginBottom,
}: {
  nodes: Array<{ id: string; node: ReactNode }>
  duration: number
  marginBottom: number
}) {
  const [height_list, refs] = useListOffsetHeight<HTMLDivElement>(nodes.length)
  console.log('height_list', height_list)
  return (
    <TransitionGroup>
      {nodes.map((e, idx) => {
        const height = height_list[idx] || undefined
        const style = {
          '--timing': duration ? `${duration}ms` : undefined,
          '--inner-height': height ? `${height}px` : undefined,
          '--margin-bottom': marginBottom ? `${marginBottom}px` : undefined
        } as React.CSSProperties

        return (
          <CSSTransition
            key={e.id}
            timeout={duration}
            classNames={{
              enter: s.TransitionItemEnter,
              enterActive: s.TransitionItemEnterActive,
              enterDone: s.TransitionItemEnterDone,
              exit: s.TransitionItemExit,
              exitActive: s.TransitionItemExitActive,
              exitDone: s.TransitionItemExitDone,
            }}
          >
            <div
              className={s.TransitionItem}
              ref={(ref) => {
                if (ref) {
                  refs.current[idx] = ref
                }
              }}
              style={style}
            >{e.node}</div>
          </CSSTransition>
        )
      })}
    </TransitionGroup>
  )
}
