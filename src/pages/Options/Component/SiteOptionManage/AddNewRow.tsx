import React, { useMemo, useState } from 'react'
import SettingItem from '../SettingItem'
import { SiteWindowFrame } from './SiteWindow'

import plusSrc from './plus.svg'
import s from './AddNewRow.module.css'

import { Transition } from 'react-transition-group'

const duration = 382

const defaultStyle = {
  transition: `height ${duration}ms ease-in-out`,
  height: '',
}

export default function AddNewRow(props: {
  isEdit: boolean
  onClickAdd(): void
}) {
  const [enableAnimation, setEnableAnimation] = useState(false)

  const transitionStyles: Record<string, React.CSSProperties> = {
    entering: {
      opacity: 0,
      height: 'calc(176px + 12px)',
      transition: `height ${duration}ms ease-in-out`,
      transitionDelay: '382ms'
    },
    entered:  {
      opacity: 1,
      height: 'calc(176px + 12px)',
      transition: `opacity ${duration}ms, height ${duration}ms ease-in-out`,
      transitionDelay: '480ms'
    },
    exiting:  {
      opacity: 0,
      height: '0px',
      paddingBottom: '0',
      transition: `opacity 0ms, height 0ms`,
    },
    exited:  {
      opacity: 0,
      height: '0px',
      paddingBottom: '0',
      transition: `opacity 0ms, height 0ms`,
    },
  }

  const showAdd = useMemo(() => !props.isEdit, [props.isEdit])

  return (
    <Transition
      in={showAdd}
      timeout={duration}
      onEntered={() => {
        setTimeout(() => {
          setEnableAnimation(false)  
        }, duration * 2)
      }}
    >
      {state => (
        <div
          className={s.AddNewRowWrapper}
          style={enableAnimation ? {
            ...defaultStyle,
            ...transitionStyles[state]
          } : {}}
        >
          <SettingItem>
            <div className={s.AddNewRowInner}>
              <SiteWindowFrame>
                <img
                  className={s.AddSite}
                  src={plusSrc}
                  alt="add site option"
                  onClick={() => {
                    setEnableAnimation(true)
                    props.onClickAdd()
                  }}
                />
              </SiteWindowFrame>
            </div>
          </SettingItem>
        </div>
      )}
    </Transition>
  )
}
