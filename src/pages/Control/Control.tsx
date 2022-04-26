import React, { useCallback, useEffect, useState } from 'react';
import { Unpromise } from '../../utils/base';
import { closeAllWindow } from '../../utils/layout';
import { getSearchword, openSearchWindows } from '../../utils/search';
import ArrowButtonGroup from './components/ArrowGroup';

import SearchForm from './components/SearchForm'

import './Control.css';

const queryKeyword = getSearchword()

type Control = Unpromise<ReturnType<typeof openSearchWindows>>

function createStep() {
  let _continue = true
  return {
    canContinue: () => _continue,
    stop() { _continue = false }
  }
}

const useWindowFocus = (initFocusValue: boolean) => {
  const [ focus, setFocus ] = useState(initFocusValue)
  useEffect(() => {
    const focusHandler = () => setFocus(true)
    const blurHandler = () => setFocus(false)
    window.addEventListener("focus", focusHandler)
    window.addEventListener("blur", blurHandler)
    return () => {
      window.removeEventListener("blur", focusHandler)
      window.removeEventListener("blur", blurHandler)
    }
  }, [])
  return focus
}

const ControlApp: React.FC = () => {
  const windowIsFocus = useWindowFocus(true)
  const [isOpen, setOpen] = useState(false)
  const [keyword, setKeyword] = useState(queryKeyword)
  const [submitedKeyword, submit] = useState<string | false>(false)
  const [nowId, setId] = useState(-1)
  const [controll, setControll] = useState<Control | undefined>(undefined)
  const [text, setText] = useState('text')
  const [{ canContinue, stop }, setStep] = useState(createStep())

  const callCloseAllWindow = useCallback((ids: number[]) => {
    setOpen(false)
    closeAllWindow(ids)
  }, [])
  const onCloseAllWindow = useCallback((con: Control) => {
    const ids = con.getMatrix().flat().map(u => u.windowId)
    con.clearFocusChangedHandler()
    con.clearRemoveHandler()
    callCloseAllWindow(ids)
  }, [callCloseAllWindow])

  useEffect(() => {
    submit(queryKeyword)
  }, [])

  useEffect(() => {
    const handler = () => {
      stop()
      if (controll !== undefined) {
        onCloseAllWindow(controll)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [controll, onCloseAllWindow, stop])

  useEffect(() => {
    if (submitedKeyword !== false) {
      setOpen(true)
      openSearchWindows(submitedKeyword, canContinue, stop).then(newControll => {
        setControll(newControll)
        newControll.setRemoveHandler()
        newControll.setFocusChangedHandler()
      }).catch(err => {
        // alert(`${err.cancel}`)
        if (err.cancel) {
          // 提前取消
          const ids = err.ids as number[]
          callCloseAllWindow(ids)
          window.close()
          // chrome.runtime.id
        }
      })
    }
  }, [callCloseAllWindow, canContinue, stop, submitedKeyword])

  return (
    <div className="container">
      {windowIsFocus}
      <SearchForm
        keyword={keyword}
        setKeyword={setKeyword}
        submitButtonActive={windowIsFocus}
        onSubmit={({ keyword: newSearchKeyword }) => {
          if (controll !== undefined) {
            onCloseAllWindow(controll)
            submit(newSearchKeyword)
            setStep(createStep())
          } else {
            submit(newSearchKeyword)
            setStep(createStep())
          }
        }}
      />
      <ArrowButtonGroup onClick={(type) => { alert(`点击了 ${type}`) }} />
    </div>
  )
}
export default ControlApp
