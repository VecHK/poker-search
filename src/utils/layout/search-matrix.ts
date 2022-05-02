import { SiteMatrix, SiteRow } from '../../options/site-matrix'

type Search = {
  keyword: string
  url_pattern: string
} | null
type SearchRow = Array<Search>
export type SearchMatrix = Array<SearchRow>

function createSearchRow(
  site_row: SiteRow,
  max_window_per_line: number,
  keyword: string,
): SearchRow {
  const new_row: SearchRow = []
  for (let i = 0; i < max_window_per_line; ++i) {
    const site = site_row[i]
    if (site === undefined || site === null) {
      new_row.push(null)
    } else {
      new_row.push({
        keyword,
        url_pattern: site.url_pattern
      })
    }
  }
  return new_row
}

export function createSearchMatrix(
  site_matrix: SiteMatrix,
  max_window_per_row: number,
  keyword: string,
): SearchMatrix {
  if (!site_matrix.length) {
    return []
  } else {
    const [cols, ...remain_site_matrix] = site_matrix
    
    if (max_window_per_row < cols.length) {
      return createSearchMatrix(
        [
          cols.slice(0, max_window_per_row),
          cols.slice(max_window_per_row, cols.length),
          ...remain_site_matrix
        ],
        max_window_per_row,
        keyword
      )
    } else {
      return [
        createSearchRow(cols, max_window_per_row, keyword),
        ...createSearchMatrix(remain_site_matrix, max_window_per_row, keyword)
      ]
    }
  }
}
