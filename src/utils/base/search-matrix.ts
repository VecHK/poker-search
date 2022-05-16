import { map, curry, range, nth, compose } from 'ramda'
import { SiteMatrix, SiteRow, toSearchURL, addMobileIdentifier } from '../../options/site-matrix'

type GetSearchURL = (keyword: string) => string
type SearchRow = Array<GetSearchURL>
export type SearchMatrix = Array<SearchRow>

function fillSearchRow(
  plain_window_url_pattern: string,
  max_window_per_line: number,
  site_row: SiteRow,
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

export function createSearchMatrix(
  plain_window_url_pattern: string,
  max_window_per_row: number,
  matrix: SiteMatrix,
): SearchMatrix {
  if (matrix.length === 0) {
    return []
  } else {
    const [cols, ...remain_matrix] = matrix
    
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
