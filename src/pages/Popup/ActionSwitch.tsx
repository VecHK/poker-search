import React from 'react'

import './ActionSwitch.css'

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
    <div className="action-switch">
      <div className={`action-normal ${isNormal ? '' : 'hide'}`}>
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
        >打开 Poker 设置</a>

        { !isPokerSearchIdentifier ? null : (
          <a
            href={chrome.runtime.getURL('options.html')}
            target="_blank"
            rel="noreferrer"
            onClick={PreventDefaultClick(() => {
              onAction('add-to-poker')
            })}
          >
            添加该站点到 Poker
          </a>
        ) }
      </div>
      <div className={`action-background ${isOpenBackground ? '' : 'hide'}`}>
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {
            onAction('save')
          })}
        >保存</a>

        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {
            onAction('cancel')
          })}
        >取消</a>
      </div>

      <div className={`action-background ${isSaved ? '' : 'hide'}`}>
        <a
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
          onClick={PreventDefaultClick(() => {})}
        >已保存</a>
      </div>
    </div>
  )
}
