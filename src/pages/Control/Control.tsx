import React, { useCallback, useEffect, useState } from 'react'
import { Atomic, nextTick } from 'vait'

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
import CreateSignal from '../../core/layout/signal'

type Control = Unpromise<ReturnType<typeof createSearchLayout>>

const controllProcessing = Atomic()

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

function useChangeRowShortcutKey(props: {
  onPressUp: () => void
  onPressDown: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        props.onPressUp()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        props.onPressDown()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [props])
}

const ControlApp: React.FC<{ base: Base }> = ({ base }) => {
  const windowIsFocus = useWindowFocus(true)
  const [isLoading, setLoading] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [submitedKeyword, submitKeyword] = useState<string | false>(false)

  const [controlWindowId, setControlWindowId] = useState<null | number>(null)

  const [controll, setControll] = useState<Control | null>(null)
  const [stop_creating_signal] = useState(CreateSignal<void>())
  const [creating_signal] = useState(CreateSignal<void>())

  const focusControlWindow = useCallback(async () => {
    if (controlWindowId) {
      return chrome.windows.update(controlWindowId, { focused: true })
    }
  }, [controlWindowId])

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
            controll.disableAllEvent()
            controll.refreshLayout([]).finally(() => {
              controll.enableAllEvent()
            })
          } else if (controlWindowId !== null) {
            chrome.windows.update(controlWindowId, { focused: true })
          }
        }
      }
    )
  }, [controlWindowId, controll])

  const closeAllSearchWindows = useCallback((con: Control) => {
    con.disableAllEvent()
    return closeWindows(con.getRegIds())
  }, [])

  useEffect(function closeAllWindowBeforeExit() {
    const handler = () => {
      stop_creating_signal.trigger()
      if (controll !== null) {
        closeAllSearchWindows(controll)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [closeAllSearchWindows, controll, stop_creating_signal])

  const moveControlWindow = useCallback(async (id: number) => {
    const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
    await chrome.windows.update(id, { top, left })
  }, [base.layout_height, base.limit])

  const refreshWindows = useCallback((control_window_id: number, keyword: string) => {
    console.log('refreshWindows')
    setLoading(true)

    const closeHandler = () => {
      stop_creating_signal.trigger()
      window.close()
    }
    creating_signal.receive(closeHandler)

    createSearchLayout({
      control_window_id,
      base,
      keyword,
      stop_creating_signal,
      creating_signal,
    }).then(newControll => {
      setControll(newControll)
    }).catch(err => {
      if (err.cancel) {
        // 提前取消
        console.log('提前取消')
      } else {
        console.error('createSearchLayout error', err)
        throw err
      }
    }).finally(() => {
      creating_signal.unReceive(closeHandler)
      setLoading(false)
      focusControlWindow()
    })
  }, [base, creating_signal, focusControlWindow, stop_creating_signal])

  useEffect(function controllEventsEffect() {
    if (controll !== null) {
      controll.enableAllEvent()
      return () => controll.disableAllEvent()
    }
  }, [controll])

  useEffect(function openSearchWindows() {
    console.log('openSearchWindows', controlWindowId, submitedKeyword)
    if (controlWindowId !== null) {
      if (submitedKeyword !== false) {
        if (controll === null) {
          moveControlWindow(controlWindowId).then(() => {
            refreshWindows(controlWindowId, submitedKeyword)
          })
        }
      }
    }
  }, [controlWindowId, controll, moveControlWindow, refreshWindows, submitedKeyword])

  const changeRow = useCallback((type: 'previus' | 'next') => {
    console.log('changeRow', type, controll)
    if (!controll) {
      return
    }
    controllProcessing(async () => {
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

        await focusControlWindow()

        controll.setMatrix(newMatrix)
      } finally {
        controll.enableAllEvent()
      }
    })
  }, [base, controll, focusControlWindow])

  useChangeRowShortcutKey({
    onPressUp: () => changeRow('previus'),
    onPressDown: () => changeRow('next'),
  })

  return (
    <div className="container">
      {isLoading ? <Loading /> : (
        <>
          <SearchForm
            keyword={keyword}
            keywordPlaceholder="请输入搜索词"
            setKeyword={setKeyword}
            submitButtonActive={windowIsFocus}
            onSubmit={({ keyword: newSearchKeyword }) => {
              controllProcessing(async () => {
                console.log('onSubmit', newSearchKeyword)
                if (controll === null) {
                  submitKeyword(newSearchKeyword)
                } else {
                  try {
                    setLoading(true)
                    await nextTick()
                    await Promise.all(closeAllSearchWindows(controll))
                  } finally {
                    setControll(null)
                    submitKeyword(newSearchKeyword)
                  }
                }
              })
            }}
          />
          <ArrowButtonGroup onClick={changeRow} />
        </>
      )}
    </div>
  )
}
export default ControlApp
