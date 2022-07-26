import { compose, equals, prop } from 'ramda'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import cfg from '../../config'

import { Base, initLayoutInfo, selectSiteSettingsByFiltered } from '../../core/base'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { WindowID } from '../../core/layout/window'
import { MessageEvent } from '../../message'

import getQuery from '../../utils/get-query'
import { validKeyword } from '../../utils/search'
import animatingWindow from '../../utils/animating-window'
import matchSearchPattern from '../../utils/match-search-pattern'

import useWindowFocus from '../../hooks/useWindowFocus'
import useControl from '../../hooks/useControl'
import useReFocusMessage from '../../hooks/useReFocusMessage'
import useSelectedFloorIdx from '../../components/FloorFilter/useSelectedFloorIdx'

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

function toFloorName(left: string) {
  const [, ..._floor_name] = left
  const floor_name = _floor_name.join('')
  return floor_name
}

const ControlApp: React.FC<{
  base: Base
  showTips: (t: ReactNode) => void
  controlWindowId: WindowID
  onSelectedFloorChange: (f: number[]) => void
}> = ({ base, showTips, controlWindowId, onSelectedFloorChange }) => {
  const [keywordInput, setKeywordInput] = useState('/test ')
  const [submitedKeyword, submitKeyword] = useState<string | false>(false)

  const [selected_floor_idx, setSelectedFloorIdx] = useSelectedFloorIdx(base)

  const [ result, left ] = matchSearchPattern(keywordInput)
  const is_floor_search = result && (left[0] === '/')
  const trueSelectedFloorIdx = useCallback(() => {
    const [ result, left ] = matchSearchPattern(keywordInput)
    if (result && (left[0] === '/')) {
      const floor_name = toFloorName(left)

      const idx_list = (
        base.preferences.site_settings.reduce<number[]>((idx_list, f, idx) => {
          if (f.name === floor_name) {
            return [...idx_list, idx]
          } else {
            return idx_list
          }
        }, [])
      )
      if (idx_list.length) {
        return idx_list
      } else {
        return selected_floor_idx
      }
    } else {
      return selected_floor_idx
    }
  }, [base.preferences.site_settings, keywordInput, selected_floor_idx])

  const s_ids = useMemo(() => (
    base.preferences.site_settings.map(s => s.id)
  ), [base.preferences.site_settings])
  const filtered_floor_ids = useMemo(() => (
    s_ids.filter((_, idx) => {
      return trueSelectedFloorIdx().indexOf(idx) === -1
    })
  ), [s_ids, trueSelectedFloorIdx])

  const selected_site_settings = useMemo(() => (
    selectSiteSettingsByFiltered(
      base.preferences.site_settings,
      filtered_floor_ids
    )
  ), [base.preferences.site_settings, filtered_floor_ids])

  const layout_info = useMemo(() => (
    initLayoutInfo(
      base.environment,
      base.limit,
      selected_site_settings,
    )
  ), [base.environment, base.limit, selected_site_settings])

  const [disable_search, setDisableSearch] = useState<boolean>(
    !selected_site_settings.length
  )
  useEffect(() => {
    setDisableSearch(!selected_site_settings.length)
  }, [selected_site_settings.length])

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
    console.log('openSearchWindows', controlWindowId, submitedKeyword)
    if (submitedKeyword !== false) {
      if (control === null) {
        refreshWindows(controlWindowId, layout_info, submitedKeyword).finally(() => {
          focusControlWindow()
        })
      }
    }
  }, [control, controlWindowId, focusControlWindow, layout_info, refreshWindows, submitedKeyword])

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
  }, [closeSearchWindows, control, controlProcessing, controlWindowId, moveControlWindow, setControl, setLoading])

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
          only_mode={is_floor_search}
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
          only_mode={is_floor_search}
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
  }, [disable_search, handleSubmit, is_floor_search, keywordInput, windowIsFocus])

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
                if (is_floor_search) {
                  showTips(<>你已经限定了<b>{toFloorName(left || '')}</b>，因此现在无法调整楼层</>)
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
