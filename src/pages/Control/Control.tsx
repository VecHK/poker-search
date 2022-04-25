import React, { useEffect, useState } from 'react';
import cfg, { setTitleBarHeight } from '../../config';
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

function detectTitleBarHeight() {
  return cfg.CONTROL_WINDOW_HEIGHT - window.innerHeight
}
setTitleBarHeight(detectTitleBarHeight())

const ControlApp: React.FC = () => {
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
      <SearchForm
        keyword={keyword}
        setKeyword={setKeyword}
        onSubmit={({ keyword: newSearchKeyword }) => {
          if (controll !== undefined) {
            const ids = controll.getMatrix().flat().map(u => u.windowId)
            // setText(ids.join(', '))
    
            controll.clearFocusChangedHandler()
            controll.clearRemoveHandler()
            closeAllWindow(ids)

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
