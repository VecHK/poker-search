import React, { useCallback, useEffect, useState } from 'react'
import { Atomic } from 'vait'

import cfg from '../../config'

import AddChromeEvent from '../../utils/chrome-event'
import getQuery from '../../utils/get-query'

import { Base } from '../../core/base'
import { Matrix } from '../../core/common'
import { createSearchLayout } from '../../core/layout'
import { renderMatrix } from '../../core/layout/render'
import { closeWindows, SearchWindow } from '../../core/layout/window'
import { calcControlWindowPos } from '../../core/layout/control-window'

import Loading from '../../components/Loading'
import ArrowButtonGroup from './components/ArrowGroup'

import SearchForm from './components/SearchForm'

import './Control.css'

type Control = Unpromise<ReturnType<typeof createSearchLayout>>

const changeRow = Atomic()

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

  const [keyword, setKeyword] = useState('')
  const [submitedKeyword, submitKeyword] = useState<string | false>(false)

  const [controlWindowId, setControlWindowId] = useState<null | number>(null)

  const [controll, setControll] = useState<Control | null>(null)

  const [{ canContinue, stop }, setStep] = useState(createStep())

  useEffect(function setControllWindowId() {
    chrome.windows.getCurrent().then(({ id }) => {
      if (id !== undefined) {
        setControlWindowId(id)
      }
    })
  }, [])

  useEffect(function setSearchwordFromURL() {
    const searchWord = getQuery(cfg.CONTROL_QUERY_TEXT)
    if (searchWord !== null) {
      submitKeyword(searchWord)
      setKeyword(searchWord)
    }
  }, [])

  useEffect(function handleShortcutKey() {
    return AddChromeEvent(
      chrome.commands.onCommand,
      (command: string) => {
        if (command === 'focus-layout') {
          if ((controlWindowId !== null) && (controll !== null)) {
            controll.handleFocusChanged(controlWindowId)
          } else if (controlWindowId !== null) {
            chrome.windows.update(controlWindowId, { focused: true })
          }
        }
      }
    )
  }, [controlWindowId, controll])

  const closeAllSearchWindows = useCallback((con: Control) => {
    con.disableAllEvent()
    closeWindows(con.getRegIds())
  }, [])

  useEffect(function closeAllWindowBeforeExit() {
    const handler = () => {
      stop()
      if (controll !== null) {
        closeAllSearchWindows(controll)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [controll, closeAllSearchWindows, stop])

  const moveControlWindow = useCallback(async (id: number) => {
    const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
    await chrome.windows.update(id, { top, left })
  }, [base.layout_height, base.limit])

  const refreshWindows = useCallback((control_window_id: number, keyword: string) => {
    setLoading(true)
    createSearchLayout({
      control_window_id,
      base,
      keyword,
      canContinue,
      stop,
    }).then(newControll => {
      newControll.enableAllEvent()
      setControll(newControll)
    }).catch(err => {
      if (err.cancel) {
        // 提前取消
        console.log('提前取消')
        const ids = err.ids as number[]
        closeWindows(ids)
        window.close()
      } else {
        console.error('createSearchLayout error', err)
        throw err
      }
    }).then(() => {
      setLoading(false)
    })
  }, [base, canContinue, stop])

  useEffect(function openSearchWindows() {
    if (controlWindowId !== null) {
      if (submitedKeyword !== false) {
        moveControlWindow(controlWindowId).then(() => {
          refreshWindows(controlWindowId, submitedKeyword)
        })
      }
    }
  }, [controlWindowId, moveControlWindow, refreshWindows, submitedKeyword])

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
              if (controll !== null) {
                closeAllSearchWindows(controll)
                submitKeyword(newSearchKeyword)
                setStep(createStep())
              } else {
                submitKeyword(newSearchKeyword)
                setStep(createStep())
              }
            }}
          />
          <ArrowButtonGroup onClick={(type) => {
            if (!controll) {
              return
            }
            changeRow(async () => {
              try {
                controll.disableAllEvent()

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

                await renderMatrix(
                  base,
                  newMatrix,
                  type === 'next' ? true : undefined,
                  true
                )
                
                const { id } = await chrome.windows.getCurrent()
                if (id !== undefined) {
                  await chrome.windows.update(id, {
                    focused: true,
                  })
                }
                
                controll.setMatrix(newMatrix)
              } finally {
                controll.enableAllEvent()
              }
            })
          }} />
        </>
      )}
    </div>
  )
}
export default ControlApp
