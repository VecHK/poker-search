import React, { useEffect, useState } from 'react';
import { Unpromise } from '../../utils/base';
import { closeAllWindow } from '../../utils/layout';
import { getSearchword, openSearchWindows } from '../../utils/search';
import './Control.css';

const queryKeyword = getSearchword()

type Control = Unpromise<ReturnType<typeof openSearchWindows>>

function closeSearchWindow(controll: Control) {
  const ids = controll.getMatrix().flat().map(u => u.windowId)
  controll.clearFocusChangedHandler()
  controll.clearRemoveHandler()
  closeAllWindow(ids)
}

function createStep() {
  let _continue = true
  return {
    canContinue: () => _continue,
    stop() { _continue = false }
  }
}

const Panel: React.FC = () => {
  const [isOpen, setOpen] = useState(false)
  const [keyword, setKeyword] = useState(queryKeyword)
  const [submitedKeyword, submit] = useState<string | false>(false)
  const [nowId, setId] = useState(-1)
  const [controll, setControll] = useState<Control | undefined>(undefined)
  const [text, setText] = useState('text')
  const [{ canContinue, stop }, setStep] = useState(createStep())

  useEffect(() => {
    submit(queryKeyword)
  }, [])

  useEffect(() => {
    const handler = () => {
      stop()
      if (controll !== undefined) {
        const ids = controll.getMatrix().flat().map(u => u.windowId)
        controll.clearFocusChangedHandler()
        controll.clearRemoveHandler()
        closeAllWindow(ids)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [controll, stop])

  useEffect(() => {
    setOpen(true)
    if (submitedKeyword !== false) {
      openSearchWindows(submitedKeyword, canContinue, stop).then(newControll => {
        setControll(newControll)
        newControll.setRemoveHandler()
        newControll.setFocusChangedHandler()
      }).catch(err => {
        // alert(`${err.cancel}`)
        if (err.cancel) {
          // 提前取消
          const ids = err.ids as number[]
          closeAllWindow(ids)
          window.close()
          // chrome.runtime.id
        }
      })
    }
  }, [canContinue, stop, submitedKeyword])

  return (
    <div className="container">
      <input value={keyword} onChange={(e) => {
        const value = e.currentTarget.value
        setKeyword(value)
      }} />
      <button onClick={() => {
        if (controll === undefined) {
          return
        }
        const ids = controll.getMatrix().flat().map(u => u.windowId)
        // setText(ids.join(', '))

        controll.clearFocusChangedHandler()
        controll.clearRemoveHandler()
        closeAllWindow(ids)

        // set
        submit(keyword)
        setStep(createStep())
      }}>submit</button>
      {/* <div>ID: {nowId}</div> */}
      <div><code><pre>{text}</pre></code></div>
    </div>
  );
};

export default Panel;
