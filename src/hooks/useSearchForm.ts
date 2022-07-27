import { useCallback, useEffect, useMemo, useState } from 'react'
import useSelectedFloorIdx from '../components/FloorFilter/useSelectedFloorIdx'
import { Base, initLayoutInfo, selectSiteSettingsByFiltered } from '../core/base'
import matchSearchPattern from '../utils/match-search-pattern'

function toFloorName(left: string) {
  const [, ..._floor_name] = left
  const floor_name = _floor_name.join('')
  return floor_name
}

export default function useSearchForm(base: Base) {
  const [keyword_input, setKeywordInput] = useState('')
  const [submited_keyword, _submitKeyword] = useState<string | false>(false)

  const submitKeyword = useCallback((str: string) => {
    const [ result, , right ] = matchSearchPattern(str)
    if (result) {
      _submitKeyword(right)
    } else {
      _submitKeyword(str)
    }
  }, [])

  const [selected_floor_idx, setSelectedFloorIdx] = useSelectedFloorIdx(base)

  const [ result, left ] = matchSearchPattern(keyword_input)
  const is_floor_search = result && (left[0] === '/')
  const trueSelectedFloorIdx = useCallback(() => {
    const [ result, left ] = matchSearchPattern(keyword_input)
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
  }, [base.preferences.site_settings, keyword_input, selected_floor_idx])

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

  return {
    keyword_input,
    setKeywordInput,
    submited_keyword,
    submitKeyword,

    getSelectedFloorName() {
      if (left) {
        return toFloorName(left)
      } else {
        return null
      }
    },

    setSelectedFloorIdx,
    is_floor_search,
    trueSelectedFloorIdx,
    selected_site_settings,
    layout_info,
    disable_search,
  }
}
