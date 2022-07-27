import { Atomic } from 'vait'
import React, { useEffect, useMemo, useState } from 'react'

import { controlIsLaunched } from '../../../x-state/control-window-launched'
import { sendMessage } from '../../../message'
import launchControlWindow from '../../../Background/modules/launch'

import { validKeyword } from '../../../utils/search'

import { WindowID } from '../../../core/layout/window'
import { Base, createBase } from '../../../core/base'

import useCurrentWindow from '../../../hooks/useCurrentWindow'
import useWindowFocus from '../../../hooks/useWindowFocus'
import { saveFilteredFloor } from '../../../x-state/filtered-floor'

import SearchForm from '../../../components/SearchForm'
import FloorFilter from '../../../components/FloorFilter'

import './0-Search.css'
import useSearchForm from '../../../hooks/useSearchForm'

const processing = Atomic()

export default function SearchFormLayout({ isOpenBackground }: { isOpenBackground: boolean }) {
  const [base, setBase] = useState<Base | undefined>()
  const currentWindow = useCurrentWindow()

  function refreshBase() {
    createBase(undefined).then((base) => {
      setBase(base)
    })
  }

  useEffect(refreshBase, [])

  if (!base || !currentWindow) {
    return <></>
  } else {
    return (
      <main className="Search">
        <div className="search-form-wrap">
          <SearchLayout
            base={base}
            current_window_id={currentWindow.windowId}
            onSelectedFloorChange={(selected_idx_list) => {
              const s_ids = base.preferences.site_settings.map(s => s.id)
              const filtered_floor = s_ids.filter((_, idx) => {
                return selected_idx_list.indexOf(idx) === -1
              })
              saveFilteredFloor(filtered_floor).then(() => {
                refreshBase()
              })
            }}
          />
        </div>
      </main>
    )
  }
}

function SearchLayout({ base, current_window_id, onSelectedFloorChange }: {
  base: Base
  current_window_id: WindowID
  onSelectedFloorChange: (f: number[]) => void
}) {
  const {
    keyword_input,
    setKeywordInput,
    disable_search,
    is_floor_search,
    trueSelectedFloorIdx,
    setSelectedFloorIdx,
    getSelectedFloorName,
  } = useSearchForm(base)

  const windowIsFocus = useWindowFocus(true)

  const searchFormNode = useMemo(() => {
    if (disable_search) {
      return (
        <SearchForm
          only_mode={false}
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
          keyword={keyword_input}
          setKeyword={setKeywordInput}
          submitButtonActive={windowIsFocus}
          onSubmit={
            ({ keyword: newSearchKeyword }) => {
              if (validKeyword(newSearchKeyword)) {
                processing(async () => {
                  if (await controlIsLaunched()) {
                    console.log('send ChangeSearch message')
                    sendMessage('ChangeSearch', newSearchKeyword)
                      .then(() => {
                        window.close()
                      })
                      .catch(err => {
                        console.warn('send failure:', err)
                      })
                  } else {
                    console.log('launchControlWindow')
                    launchControlWindow({
                      text: newSearchKeyword,
                      revert_container_id: current_window_id
                    })
                      .then(() => {
                        window.close()
                      }).catch(err => {
                        console.warn('launch failure:', err)
                      })
                  }
                })
              }
            }
          }
        />
      )
    }
  }, [current_window_id, disable_search, is_floor_search, keyword_input, setKeywordInput, windowIsFocus])


  return (
    <>
      <div className="search-interval"></div>

      {searchFormNode}

      <div className="search-interval"></div>
      <div className="search-interval"></div>

      <FloorFilter
        siteSettings={base.preferences.site_settings}
        selectedFloors={trueSelectedFloorIdx()}
        totalFloor={base.preferences.site_settings.length}
        onChange={(filtered) => {
          console.log('filtered onChange', filtered)
          const selected_floor_name = getSelectedFloorName()
          if (selected_floor_name) {
            alert(`你已经限定了${selected_floor_name}，因此现在无法调整楼层`)
          } else {
            onSelectedFloorChange(filtered)
            setSelectedFloorIdx(filtered)
          }
        }}
      />
    </>
  )
}
