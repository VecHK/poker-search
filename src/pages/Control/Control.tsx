import { Atomic } from 'vait'
import { compose, equals, prop, thunkify } from 'ramda'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import cfg from '../../config'

import { Base } from '../../core/base'
import { getControlWindowHeight } from '../../core/base/control-window-height'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { WindowID } from '../../core/layout/window'
import { MessageEvent } from '../../message'

import getQuery from '../../utils/get-query'
import { validKeyword } from '../../utils/search'
import animatingWindow from '../../utils/animating-window'

import useWindowFocus from '../../hooks/useWindowFocus'
import useSearchForm from '../../hooks/useSearchForm'
import useControl from './hooks/useControl'
import useChangeRowShortcutKey from './hooks/useChangeRowShortcutKey'
import useChangeRow from './hooks/useChangeRow'

import Loading from '../../components/Loading'
import SearchForm from '../../components/SearchForm'
import ArrowButtonGroup from './components/ArrowGroup'
import FloorFilter from '../../components/FloorFilter'

import BGSrc from '../../assets/control-bg.png'

import './Control.css'
import useFocusControlMessage from './hooks/useFocusControlMessage'

const controlProcessing = Atomic()

const ControlApp: React.FC<{
  base: Base
  showTips: (t: ReactNode) => void
  controlWindowId: WindowID
  onSelectedFloorChange: (f: number[]) => void
}> = ({ base, showTips, controlWindowId, onSelectedFloorChange }) => {
  const window_is_focused = useWindowFocus(true)

  const focusControlWindow = useCallback(async () => {
    return chrome.windows.update(controlWindowId, { focused: true })
  }, [controlWindowId])

  useEffect(function focusControlWindowAfterLoad() {
    focusControlWindow()
  }, [focusControlWindow])

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

  const {
    isLoading,
    setLoading,
    search_layout,
    setSearchLayout,
    closeSearchWindows,
    constructSearchLayout,
  } = useControl(base)

  useFocusControlMessage(
    controlWindowId,
    search_layout
  )

  const controlChangeRow = useChangeRow(controlProcessing, base, layout_info, search_layout)
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
      if (search_layout === null) {
        constructSearchLayout(controlWindowId, layout_info, submited_keyword).finally(() => {
          focusControlWindow()
        })
      }
    }
  }, [constructSearchLayout, controlWindowId, focusControlWindow, layout_info, search_layout, submited_keyword])

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

  const handleSubmit = useCallback((newSearchKeyword: string) => {
    console.log('onSubmit')
    const valid_msg = validKeyword(newSearchKeyword)
    if (valid_msg) {
      showTips(valid_msg)
    } else {
      setKeywordInput(newSearchKeyword)

      controlProcessing(async () => {
        console.log('onSubmit', newSearchKeyword)
        setLoading(true)
        if (search_layout) {
          search_layout.cancelAllEvent()
          await closeSearchWindows(search_layout)
        }
        moveControlWindow(controlWindowId).then(() => {
          setSearchLayout(() => {
            // 写成这样是处理提交同样搜索词的时候的处理
            // 因为是用 useEffect 来判断的，如果是相同的值就不会触发更新了
            submitKeyword(newSearchKeyword)
            return null
          })
        })
      })
    }
  }, [closeSearchWindows, controlWindowId, moveControlWindow, search_layout, setKeywordInput, setLoading, setSearchLayout, showTips, submitKeyword])

  const [_can_preset_searchword, setSearchwordPresetStatus] = useState(true)
  useEffect(function searchByOmnibox() {
    const search_word = getQuery(cfg.CONTROL_QUERY_TEXT)
    if (search_word !== null) {
      if (_can_preset_searchword) {
        setSearchwordPresetStatus(false)
        handleSubmit(search_word)
      }
    }
  }, [_can_preset_searchword, handleSubmit])

  useEffect(function receiveChangeSearchMessage() {
    const [ applyReceive, cancelReceive ] = MessageEvent('ChangeSearch', (new_keyword) => {
      search_layout?.cancelAllEvent()

      chrome.windows.update(controlWindowId, { focused: true }).then(() => {
        handleSubmit(new_keyword)
      })
    })
    applyReceive()

    return cancelReceive
  }, [controlWindowId, search_layout, handleSubmit])

  const searchFormNode = useMemo(() => {
    if (disable_search) {
      return (
        <SearchForm
          only_mode={false}
          keywordPlaceholder={'请选择至少一层的站点配置'}
          keyword={''}
          setKeyword={thunkify(showTips)('请选择至少一层的站点配置')}
          onSubmit={thunkify(showTips)('请选择至少一层的站点配置')}
          submitButtonActive={window_is_focused}
        />
      )
    } else {
      return (
        <SearchForm
          only_mode={is_floor_search}
          keywordPlaceholder={'请输入搜索词'}
          keyword={keyword_input}
          setKeyword={setKeywordInput}
          submitButtonActive={window_is_focused}
          onSubmit={
            compose(
              handleSubmit,
              prop<'keyword', string>('keyword')
            )
          }
        />
      )
    }
  }, [disable_search, handleSubmit, is_floor_search, keyword_input, setKeywordInput, showTips, window_is_focused])

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
