import React, { ReactNode } from 'react'

import s from './ActionSwitch.module.css'

export type Action = 'add-to-poker' | 'save' | 'cancel'
export type SwitchState = 'NORMAL' | 'BACKGROUND' | 'SAVED'

function PreventDefaultClick<E extends { preventDefault(): void }>(
  fn: (e: E) => void
) {
  return (
    function onClick(e: E) {
      e.preventDefault()
      return fn(e)
    }
  )
}

export function ActionBar(props: { name: string; show: boolean; children: ReactNode; }) {
  return (
    <div className={`${s.Action} action-${props.name} ${props.show ? '' : s.Hide}`}>
      {props.children}
    </div>
  )
}

export function ActionLink({ onClick, children }: { onClick?: () => void, children: ReactNode }) {
  return (
    <a
      className={s.ActionLink}
      onClick={PreventDefaultClick(() => onClick && onClick())}
      href="/"
      target="_blank"
      rel="noreferrer"
    >{ children }</a>
  )
}

export function ActionWrap(p: { children: ReactNode }) {
  return <div className={s.ActionSwitch}>{p.children}</div>
}

export default function ActionSwitch({
  state,
  isPokerSearchIdentifier,
  actions
}: {
  state: SwitchState
  isPokerSearchIdentifier: boolean
  actions: { [k in Action]: () => void }
}) {
  function onAction(act: Action) {
    actions[act]()
  }

  const isNormal = state === 'NORMAL'
  const isOpenBackground = state === 'BACKGROUND'
  const isSaved = state === 'SAVED'

  return (
    <ActionWrap>
      <ActionBar name="NORMAL" show={isNormal}>
        <ActionLink onClick={() => chrome.runtime.openOptionsPage()}>打开 Poker 设置</ActionLink>

        { !isPokerSearchIdentifier ? null : (
          <ActionLink
            onClick={() => {
              onAction('add-to-poker')
            }}
          >添加该站点到 Poker</ActionLink>
        ) }
      </ActionBar>

      <ActionBar name="BACKGROUND" show={isOpenBackground}>
        <ActionLink onClick={() => onAction('save')}>保存</ActionLink>
        <ActionLink onClick={() => onAction('cancel')}>取消</ActionLink>
      </ActionBar>

      <ActionBar name="SAVED" show={isSaved}>
        <ActionLink>已保存</ActionLink>
      </ActionBar>
    </ActionWrap>
  )
}
