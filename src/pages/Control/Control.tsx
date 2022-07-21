import { compose, prop } from 'ramda'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import cfg from '../../config'

import { Base } from '../../core/base'
import { SiteSettingFloorID } from '../../preferences'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { WindowID } from '../../core/layout/window'
import { MessageEvent } from '../../message'

import getQuery from '../../utils/get-query'
import { validKeyword } from '../../utils/search'
import animatingWindow from '../../utils/animating-window'

import useWindowFocus from '../../hooks/useWindowFocus'
import useCurrentWindow from '../../hooks/useCurrentWindow'
import useControl from '../../hooks/useControl'
import useReFocusMessage from '../../hooks/useReFocusMessage'
import usePreventEnterFullScreen from '../../hooks/usePreventEnterFullScreen'

import Loading from '../../components/Loading'
import SearchForm from '../../components/SearchForm'
import ArrowButtonGroup from './components/ArrowGroup'
import FloorFilter from './components/FloorFilter'

import BGSrc from '../../assets/control-bg.png'

import './Control.css'

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

function toSelectedFloorIds(
  floor_ids: SiteSettingFloorID[],
  filtered_list: SiteSettingFloorID[],
): SiteSettingFloorID[] {
  return floor_ids.filter((id) => {
    return filtered_list.indexOf(id) === -1
  })
}

function toSelectedFloorIdx(
  floor_ids: SiteSettingFloorID[],
  filtered_list: SiteSettingFloorID[],
): number[] {
  return toSelectedFloorIds(floor_ids, filtered_list).map((id) => {
    return floor_ids.indexOf(id)
  })
}

const ControlApp: React.FC<{
  base: Base
  onSelectedFloorChange: (f: number[]) => void
}> = ({ base, onSelectedFloorChange }) => {
  const [keywordInput, setKeywordInput] = useState('')
  const [submitedKeyword, submitKeyword] = useState<string | false>(false)

  const s_ids = base.preferences.site_settings.map(s => s.id)
  const [selected_floor_idx, setSelectedFloorIdx] = useState<number[]>(
    toSelectedFloorIdx(
      s_ids,
      base.init_filtered_floor
    )
  )
  const [disable_search, setDisableSearch] = useState<boolean>(
    !base.filtered_site_settings.length
  )
  useEffect(() => {
    setDisableSearch(!base.filtered_site_settings.length)
  }, [base.filtered_site_settings.length])

  const windowIsFocus = useWindowFocus(true)

  const controlWindow = useCurrentWindow()
  const controlWindowId = controlWindow?.windowId

  const {
    isLoading,
    setLoading,
    control,
    setControl,
    refreshWindows,
    changeRow: controlChangeRow,
    controlProcessing,
  } = useControl(base)

  usePreventEnterFullScreen(controlWindow?.windowId)

  useReFocusMessage(controlWindowId, control)

  const focusControlWindow = useCallback(async () => {
    if (controlWindowId !== undefined) {
      return chrome.windows.update(controlWindowId, { focused: true })
    }
  }, [controlWindowId])

  const moveControlWindow = useCallback(async (id: WindowID) => {
    const [ top, left ] = calcControlWindowPos(
      base.control_window_height,
      base.layout_height,
      base.limit
    )
    const win = await chrome.windows.get(id)
    await animatingWindow(id, 382, {
      top: win.top,
      left: win.left,
      height: win.height,
    }, {
      top,
      left,
      height: base.control_window_height,
    })
  }, [base.control_window_height, base.layout_height, base.limit])

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
          setLoading(true)
          moveControlWindow(controlWindowId).then(() => {
            refreshWindows(controlWindowId, submitedKeyword).finally(() => {
              focusControlWindow()
            })
          })
        }
      }
    }
  }, [control, controlWindowId, focusControlWindow, moveControlWindow, refreshWindows, setLoading, submitedKeyword])

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
  }, [])

  const handleSubmit = useCallback((newSearchKeyword: string) => {
    console.log('onSubmit')
    if (validKeyword(newSearchKeyword)) {
      setKeywordInput(newSearchKeyword)

      controlProcessing(async () => {
        console.log('onSubmit', newSearchKeyword)
        if (control === null) {
          submitKeyword(newSearchKeyword)
        } else {
          setControl(() => {
            // 写成这样是处理提交同样搜索词的时候的处理
            // 因为是用 useEffect 来判断的，如果是相同的值就不会触发更新了
            submitKeyword(newSearchKeyword)
            return null
          })
        }
      })
    }
  }, [control, controlProcessing, setControl])

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

  const searchFormNode = useMemo(() => {
    if (disable_search) {
      return (
        <SearchForm
          keywordPlaceholder={'请选择至少一层的站点配置'}
          keyword={''}
          setKeyword={() => {}}
          submitButtonActive={windowIsFocus}
          onSubmit={() => {}}
        />
      )
    } else {
      return (
        <SearchForm
          keywordPlaceholder={'请输入搜索词'}
          keyword={keywordInput}
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
  }, [disable_search, handleSubmit, keywordInput, windowIsFocus])

  return (
    <main className="control-main" style={{ background: `url(${BGSrc})` }}>
      {isLoading ? <Loading /> : (
        <>
          {searchFormNode}

          <ArrowButtonGroup onClick={changeRow} />

          <FloorFilter
            selectedFloors={selected_floor_idx}
            totalFloor={base.preferences.site_settings.length}
            onChange={(filtered) => {
              console.log('filtered onChange', filtered)
              onSelectedFloorChange(filtered)
              setSelectedFloorIdx(filtered)
            }}
          />
        </>
      )}
    </main>
  )
}
export default ControlApp
