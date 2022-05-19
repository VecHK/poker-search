import React, { useCallback, useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import { Base } from '../../core/base'
import { Matrix } from '../../core/common'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { createSearch } from '../../core/layout'
import { renderMatrix } from '../../core/layout/render'
import { closeAllWindow, SearchWindow } from '../../core/layout/window'
import { getSearchword } from '../../utils/search'
import ArrowButtonGroup from './components/ArrowGroup'

import SearchForm from './components/SearchForm'

import './Control.css'

const queryKeyword = getSearchword()

type Control = Unpromise<ReturnType<typeof createSearch>>

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

const ControlApp: React.FC<{ base: Base }> = ({ base }) => {
  const windowIsFocus = useWindowFocus(true)
  const [isLoading, setLoading] = useState(false)
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

  const moveControlWindow = useCallback(async () => {
    const { id } = await chrome.windows.getCurrent()
    if (id !== undefined) {
      const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
      await chrome.windows.update(id, { top, left })
    }
  }, [base])

  const refreshWindows = useCallback((keyword: string) => {
    setLoading(true)
    createSearch({
      base,
      keyword,
      canContinue,
      stop,
    }).then(newControll => {
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
      } else {
        console.error('createSearch error', err)
      }
    }).then(() => {
      setLoading(false)
    })
  }, [base, callCloseAllWindow, canContinue, stop])

  useEffect(() => {
    if (submitedKeyword !== false) {
      setOpen(true)
      moveControlWindow().then(() => {
        refreshWindows(submitedKeyword)
      })
    }
  }, [moveControlWindow, refreshWindows, submitedKeyword])

  return (
    <div className="container">
      {isLoading ? <Loading /> : (
        <>
          <SearchForm
            keyword={keyword}
            setKeyword={setKeyword}
            submitButtonActive={windowIsFocus}
            onSubmit={({ keyword: newSearchKeyword }) => {
              setLoading(true)
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
          <ArrowButtonGroup onClick={(type) => {
            if (!controll) {
              return
            }
            const remainMatrix = [...controll.getMatrix()]
            const latestRow = type === 'next' ? remainMatrix.pop() : remainMatrix.shift()

            let newMatrix: Matrix<SearchWindow>

            if (latestRow === undefined) {
              throw Error('latestRow is undefined')
            } else if (type === 'next') {
              newMatrix = [latestRow, ...remainMatrix]
            } else {
              newMatrix = [...remainMatrix, latestRow]
            }

            controll.clearFocusChangedHandler()
            renderMatrix(
              base,
              newMatrix,
              type === 'next' ? true : undefined,
              true
            ).then(() => {
              return chrome.windows.getCurrent()
            }).then(({id}) => {
              if (id !== undefined) {
                return chrome.windows.update(id, {
                  focused: true,
                })
              }
            }).then(() => {
              controll.setMatrix(newMatrix)
              controll.setFocusChangedHandler()
            })
          }} />
        </>
      )}
    </div>
  )
}
export default ControlApp
