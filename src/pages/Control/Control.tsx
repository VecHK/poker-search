import { compose, equals, prop, thunkify } from 'ramda'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'

import cfg from '../../config'

import { Base } from '../../core/base'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { WindowID } from '../../core/layout/window'
import { MessageEvent } from '../../message'

import getQuery from '../../utils/get-query'
import { validKeyword } from '../../utils/search'
import animatingWindow from '../../utils/animating-window'

import useWindowFocus from '../../hooks/useWindowFocus'
import useControl from '../../hooks/useControl'
import useReFocusMessage from '../../hooks/useReFocusMessage'
import useSearchForm from '../../hooks/useSearchForm'

import Loading from '../../components/Loading'
import SearchForm from '../../components/SearchForm'
import ArrowButtonGroup from './components/ArrowGroup'
import FloorFilter from '../../components/FloorFilter'

import BGSrc from '../../assets/control-bg.png'

import './Control.css'
import { getControlWindowHeight } from '../../core/base/control-window-height'

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

const ControlApp: React.FC<{
  base: Base
  showTips: (t: ReactNode) => void
  controlWindowId: WindowID
  onSelectedFloorChange: (f: number[]) => void
}> = ({ base, showTips, controlWindowId, onSelectedFloorChange }) => {
  const {
    keyword_input,
    setKeywordInput,
    submited_keyword,
    submitKeyword,

    is_floor_search,
    setSelectedFloorIdx,
    trueSelectedFloorIdx,

    disable_search,

    selected_site_settings,
    layout_info,

    getSelectedFloorName,
  } = useSearchForm(base)

  const windowIsFocus = useWindowFocus(true)

  const {
    isLoading,
    setLoading,
    control,
    setControl,
    closeSearchWindows,
    refreshWindows,
    changeRow: controlChangeRow,
    controlProcessing,
  } = useControl(base, layout_info)

  const focusControlWindow = useCallback(async () => {
    return chrome.windows.update(controlWindowId, { focused: true })
  }, [controlWindowId])

  useReFocusMessage(controlWindowId, control)

  const moveControlWindow = useCallback(async (id: WindowID) => {
    const [ top, left ] = calcControlWindowPos(
      getControlWindowHeight(selected_site_settings),
      layout_info.total_height,
      base.limit
    )
    const win = await chrome.windows.get(id)

    const not_move = equals(
      [win.top, win.left, win.height],
      [top, left, getControlWindowHeight(selected_site_settings)]
    )

    if (!not_move) {
      await animatingWindow(id, 382, {
        top: win.top,
        left: win.left,
        height: win.height,
      }, {
        top,
        left,
        height: getControlWindowHeight(selected_site_settings),
      })
    }
  }, [base.limit, layout_info.total_height, selected_site_settings])

  function changeRow(act: 'previus' | 'next') {
    controlChangeRow(act).then(focusControlWindow)
  }
  useChangeRowShortcutKey({
    onPressUp: () => changeRow('previus'),
    onPressDown: () => changeRow('next')
  })

  useEffect(function openSearchWindows() {
    console.log('openSearchWindows', controlWindowId, submited_keyword)
    if (submited_keyword !== false) {
      if (control === null) {
        refreshWindows(controlWindowId, layout_info, submited_keyword).finally(() => {
          focusControlWindow()
        })
      }
    }
  }, [control, controlWindowId, focusControlWindow, layout_info, refreshWindows, submited_keyword])

  useEffect(function focusControlWindowAfterLoad() {
    focusControlWindow()
  }, [focusControlWindow])

  useEffect(function setSearchwordFromURL() {
    const searchWord = getQuery(cfg.CONTROL_QUERY_TEXT)
    if (searchWord !== null) {
      if (validKeyword(searchWord)) {
        submitKeyword(searchWord)
        setKeywordInput(searchWord)
      }
    }
  }, [setKeywordInput, submitKeyword])

  const handleSubmit = useCallback((newSearchKeyword: string) => {
    console.log('onSubmit')
    if (validKeyword(newSearchKeyword)) {
      setKeywordInput(newSearchKeyword)

      controlProcessing(async () => {
        console.log('onSubmit', newSearchKeyword)
        setLoading(true)
        if (control) {
          control.cancelAllEvent()
          await closeSearchWindows(control)
        }
        moveControlWindow(controlWindowId).then(() => {
          setControl(() => {
            // 写成这样是处理提交同样搜索词的时候的处理
            // 因为是用 useEffect 来判断的，如果是相同的值就不会触发更新了
            submitKeyword(newSearchKeyword)
            return null
          })
        })
      })
    }
  }, [closeSearchWindows, control, controlProcessing, controlWindowId, moveControlWindow, setControl, setKeywordInput, setLoading, submitKeyword])

  useEffect(function receiveChangeSearchMessage() {
    const [ applyReceive, cancelReceive ] = MessageEvent('ChangeSearch', (new_keyword) => {
      control?.cancelAllEvent()

      chrome.windows.update(controlWindowId, { focused: true }).then(() => {
        handleSubmit(new_keyword)
      })
    })
    applyReceive()

    return cancelReceive
  }, [controlWindowId, control, handleSubmit])

  const searchFormNode = useMemo(() => {
    if (disable_search) {
      return (
        <SearchForm
          only_mode={false}
          keywordPlaceholder={'请选择至少一层的站点配置'}
          keyword={''}
          setKeyword={thunkify(showTips)('请选择至少一层的站点配置')}
          onSubmit={thunkify(showTips)('请选择至少一层的站点配置')}
          submitButtonActive={windowIsFocus}
        />
      )
    } else {
      return (
        <SearchForm
          only_mode={is_floor_search}
          keywordPlaceholder={'请输入搜索词'}
          keyword={keyword_input}
          setKeyword={setKeywordInput}
          submitButtonActive={windowIsFocus}
          onSubmit={
            compose(
              handleSubmit,
              prop<'keyword', string>('keyword')
            )
          }
        />
      )
    }
  }, [disable_search, handleSubmit, is_floor_search, keyword_input, setKeywordInput, showTips, windowIsFocus])

  return (
    <main className="control-main" style={{ background: `url(${BGSrc})` }}>
      {isLoading ? <Loading /> : (
        <>
          {searchFormNode}

          <div className="button-group-wrapper">
            <ArrowButtonGroup onClick={changeRow} />
          </div>

          <div className="floor-filter-wrapper">
            <FloorFilter
              siteSettings={base.preferences.site_settings}
              selectedFloors={trueSelectedFloorIdx()}
              totalFloor={base.preferences.site_settings.length}
              onChange={(filtered) => {
                const selected_floor_name = getSelectedFloorName()
                if (selected_floor_name) {
                  showTips(<>你已经限定了<b>{selected_floor_name}</b>，因此现在无法调整楼层</>)
                } else {
                  console.log('filtered onChange', filtered)
                  onSelectedFloorChange(filtered)
                  setSelectedFloorIdx(filtered)
                }
              }}
            />
          </div>
        </>
      )}
    </main>
  )
}
export default ControlApp
