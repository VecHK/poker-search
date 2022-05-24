import { map, curry, range, nth, compose } from 'ramda'
import cfg from '../../config'
import { Matrix, Row } from '../common'

import {
  toSearchURL,
  addMobileIdentifier,
  SiteOption,
  SiteSettings,
  toMatrix
} from '../../preferences/site-settings'

type GetSearchURL = (keyword: string) => string
type SearchRow = Array<GetSearchURL>
export type SearchMatrix = Array<SearchRow>

function fillSearchRow(
  plain_window_url_pattern: string,
  max_window_per_line: number,
  site_row: Row<SiteOption>,
): SearchRow {
  return map(
    (col) => {
      const site_opt = nth(col, site_row)
      if (site_opt === undefined) {
        return curry(toSearchURL)(plain_window_url_pattern)
      } else {
        const toUrl = curry(toSearchURL)(site_opt.url_pattern)
        if (site_opt.enable_mobile) {
          return compose(addMobileIdentifier, toUrl)
        } else {
          return toUrl
        }
      }
    },
    range(0, max_window_per_line)
  )
}

function createSearchMatrix(
  plain_window_url_pattern: string,
  max_window_per_row: number,
  site_matrix: Matrix<SiteOption>,
): SearchMatrix {
  if (site_matrix.length === 0) {
    return []
  } else {
    const [cols, ...remain_matrix] = site_matrix
    
    if (max_window_per_row < cols.length) {
      return createSearchMatrix(
        plain_window_url_pattern,
        max_window_per_row,
        [
          cols.slice(0, max_window_per_row),
          cols.slice(max_window_per_row, cols.length),
          ...remain_matrix
        ],
      )
    } else {
      return [
        fillSearchRow(plain_window_url_pattern, max_window_per_row, cols),
        ...createSearchMatrix(plain_window_url_pattern, max_window_per_row, remain_matrix)
      ]
    }
  }
}

export function initSearchMatrix(
  max_window_per_line: number,
  site_settings: SiteSettings
) {
  const search_matrix = createSearchMatrix(
    cfg.PLAIN_SEARCH_WINDOW_URL_PATTERN,
    max_window_per_line,
    toMatrix(site_settings),
  )
  const search_count = search_matrix.flat().length
  const total_row = Math.ceil(search_count / max_window_per_line)

  return [ total_row, search_matrix ] as const
}
