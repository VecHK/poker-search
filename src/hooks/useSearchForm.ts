import { join, map, pipe, split } from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSelectedFloorIdx from '../components/FloorFilter/useSelectedFloorIdx'
import { Base, initLayoutInfo, selectSiteSettingsByFiltered } from '../core/base'
import { SiteSettings } from '../preferences'
import matchSearchPattern from '../utils/match-search-pattern'

export const specify_floor_prefixs = [...'\\-。，·・～`｀、']
const prefix_regex = /\/|\\|-|。|，|·|・|～|`|｀|、/

const FULL_WIDTH_NUMBERS = [...`０１２３４５６７８９`]

function toHalfWidthNumberChar(ch: string) {
  const num = FULL_WIDTH_NUMBERS.indexOf(ch)
  if (num !== -1) {
    return String(num)
  } else {
    return ch
  }
}

const toHalfWidthNumber = pipe(
  split(''),
  map(toHalfWidthNumberChar),
  join('')
)

if (global) Object.assign(global, { toHalfWidthNumber })

function toFloorName(left: string) {
  const [, ..._floor_name] = left
  const floor_name = _floor_name.join('')
  return floor_name
}

function parseFloorSpecify(input_text: string) {
  const [ result, left, search_text ] = matchSearchPattern(input_text)
  if (result && prefix_regex.test(left[0])) {
    return [ true, toFloorName(left), search_text ] as const
  } else {
    return [ false ] as const
  }
}

function isFloorSearch(search_text: string) {
  const [ res ] = parseFloorSpecify(search_text)
  return res
}

function specifyFloorIdxByFloorName(
  site_settings: SiteSettings,
  floor_name: string
) {
  const idx_list = (
    site_settings.reduce<number[]>((idx_list, f, idx) => {
      if (f.name === floor_name) {
        return [...idx_list, idx]
      } else {
        return idx_list
      }
    }, [])
  )
  return idx_list
}

function isFloorNumber(input_str: string) {
  const test_str = toHalfWidthNumber(input_str)
  return (
    /^[0-9]+$/.test(test_str) ||
    /^[0-9]+F$/i.test(test_str) ||
    /^[0-9]+ｆ$/i.test(test_str) ||
    /^[0-9]+Ｆ$/i.test(test_str)
  )
}

export function specifyFloorIdxBySearchText(text: string, site_settings: SiteSettings) {
  const [ res, floor_name ] = parseFloorSpecify(text)
  if (res) {
    if (isFloorNumber(floor_name)) {
      const f_number = parseInt(toHalfWidthNumber(floor_name))
      const select_floor_idx = f_number - 1
      if (select_floor_idx < site_settings.length) {
        return [ f_number - 1 ]
      } else {
        return specifyFloorIdxByFloorName(site_settings, floor_name)
      }
    } else {
      return specifyFloorIdxByFloorName(site_settings, floor_name)
    }
  } else {
    return []
  }
}

export default function useSearchForm(base: Base) {
  const [keyword_input, setKeywordInput] = useState('')
  const [submited_keyword, _submitKeyword] = useState<string | false>(false)

  const submitKeyword = useCallback((str: string) => {
    const [ is_floor_search, , search_text ] = parseFloorSpecify(str)
    if (is_floor_search) {
      _submitKeyword(search_text)
    } else {
      _submitKeyword(str)
    }
  }, [])

  const [selected_floor_idx, setSelectedFloorIdx] = useSelectedFloorIdx(base)

  const trueSelectedFloorIdx = useCallback(() => {
    const search_result_idx = specifyFloorIdxBySearchText(keyword_input, base.preferences.site_settings)
    if (search_result_idx.length) {
      return search_result_idx
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
      const [ is_floor_search, floor_name ] = parseFloorSpecify(keyword_input)
      if (is_floor_search) {
        return floor_name
      } else {
        return null
      }
    },

    setSelectedFloorIdx,
    is_floor_search: isFloorSearch(keyword_input),
    trueSelectedFloorIdx,
    selected_site_settings,
    layout_info,
    disable_search,
  }
}
