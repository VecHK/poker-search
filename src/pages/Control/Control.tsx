import { nextTick } from 'vait'
import React, { useCallback, useEffect, useState } from 'react'

import cfg from '../../config'

import getQuery from '../../utils/get-query'
import { validKeyword } from '../../utils/search'

import { Base } from '../../core/base'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { MessageEvent } from '../../message'

import useWindowFocus from '../../hooks/useWindowFocus'
import useCurrentWindow from '../../hooks/useCurrentWindow'
import useLaunchContextMenu from '../../hooks/useLaunchContextMenu'
import useControlLaunch from '../../hooks/useControlLaunch'
import useControl from '../../hooks/useControl'

import Loading from '../../components/Loading'
import SearchForm from '../../components/SearchForm'
import ArrowButtonGroup from './components/ArrowGroup'

import './Control.css'
import useFocusLayoutShortcut from '../../hooks/useFocusShortcut'

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
  const [keyword, setKeyword] = useState('')
  const [submitedKeyword, submitKeyword] = useState<string | false>(false)

  const windowIsFocus = useWindowFocus(true)

  const controlWindowId = useCurrentWindow()?.windowId

  const {
    isLoading,
    setLoading,
    control,
    setControl,
    refreshWindows,
    changeRow: controlChangeRow,
    controlProcessing,
  } = useControl(base)

  const focusControlWindow = useCallback(async () => {
    if (controlWindowId !== undefined) {
      return chrome.windows.update(controlWindowId, { focused: true })
    }
  }, [controlWindowId])

  const moveControlWindow = useCallback(async (id: number) => {
    const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
    await chrome.windows.update(id, { top, left })
  }, [base.layout_height, base.limit])

  function changeRow(act: 'previus' | 'next') {
    controlChangeRow(act).then(focusControlWindow)
  }
  useChangeRowShortcutKey({
    onPressUp: () => changeRow('previus'),
    onPressDown: () => changeRow('next')
  })

  useEffect(function openSearchWindows() {
    console.log('openSearchWindows', controlWindowId, submitedKeyword)
    if (controlWindowId !== undefined) {
      if (submitedKeyword !== false) {
        if (control === null) {
          moveControlWindow(controlWindowId)
          refreshWindows(controlWindowId, submitedKeyword).finally(() => {
            focusControlWindow()
          })
        }
      }
    }
  }, [control, controlWindowId, focusControlWindow, moveControlWindow, refreshWindows, submitedKeyword])

  useEffect(function focusControlWindowAfterLoad() {
    focusControlWindow()
  }, [focusControlWindow])

  useEffect(function setSearchwordFromURL() {
    const searchWord = getQuery(cfg.CONTROL_QUERY_TEXT)
    if (searchWord !== null) {
      if (validKeyword(searchWord)) {
        submitKeyword(searchWord)
        setKeyword(searchWord)
      }
    }
  }, [])

  const handleSubmit = useCallback((newSearchKeyword: string) => {
    console.log('onSubmit')
    if (validKeyword(newSearchKeyword)) {
      controlProcessing(async () => {
        console.log('onSubmit', newSearchKeyword)
        if (control === null) {
          submitKeyword(newSearchKeyword)
        } else {
          try {
            setLoading(true)
            await nextTick()
          } finally {
            setControl(() => {
              // 写成这样是处理提交同样搜索词的时候的处理
              // 因为是用 useEffect 来判断的，如果是相同的值就不会触发更新了
              submitKeyword(newSearchKeyword)
              return null
            })
          }
        }
      })
    }
  }, [control, controlProcessing, setControl, setLoading])

  useEffect(function receiveChangeSearchMessage() {
    const [ applyReceive, cancelReceive ] = MessageEvent('ChangeSearch', (new_keyword) => {
      control?.cancelAllEvent()

      if (controlWindowId !== undefined) {
        chrome.windows.update(controlWindowId, { focused: true }).then(() => {
          handleSubmit(new_keyword)
        })
      }
    })
    applyReceive()

    return cancelReceive
  }, [controlWindowId, control, handleSubmit])

  useFocusLayoutShortcut(controlWindowId, control)
  useLaunchContextMenu(base.preferences)
  useControlLaunch()

  return (
    <div className="container">
      {isLoading ? <Loading /> : (
        <>
          <SearchForm
            keyword={keyword}
            keywordPlaceholder={`请输入搜索词`}
            setKeyword={setKeyword}
            submitButtonActive={windowIsFocus}
            onSubmit={({ keyword }) => {
              handleSubmit(keyword)
            }}
          />
          <ArrowButtonGroup onClick={changeRow} />
        </>
      )}
    </div>
  )
}
export default ControlApp
