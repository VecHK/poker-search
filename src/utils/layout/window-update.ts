import { selectCol } from '../common'
import { isCurrentRow } from './matrix'
import { SearchWindowMatrix } from './window'

const pickItem = <T extends unknown>(arr: T[], idx: number) => [
  arr[idx],
  arr.slice(0, idx),
  arr.slice(idx + 1, arr.length)
] as const

function changeCurrentRowInColumn(
  matrix: SearchWindowMatrix,
  select_row: number,
  select_col: number,
) {
  const col = selectCol(matrix, select_col)
  const [pick, start, end] = pickItem(col, select_row)
  const new_col = [...start, ...end, pick]

  return matrix.map((row, line) => {
    return row.map((u, idx) => {
      if (idx === select_col) {
        return new_col[line]
      } else {
        return u
      }
    })
  })
}

type FindRowColByIdResult = Readonly<[false]> | Readonly<[true, number, number]>
function findSearchWindowById(
  matrix: SearchWindowMatrix,
  find_id: number
): FindRowColByIdResult {
  for (let [find_row, line] of matrix.entries()) {
    for (let [find_col, u] of line.entries()) {
      if (find_id === u.windowId) {
        return [ true, find_row, find_col ]
      }
    }
  }

  return [ false ]
}

type NeedUpdate<T extends boolean> = T
type Update = Readonly<{
  new_matrix: SearchWindowMatrix
  row: number
  col: number
}>
type SelectWindowResult = 
  Readonly<[ NeedUpdate<false> ]> | 
  Readonly<[ NeedUpdate<true>, Update ]>
export function selectWindow(
  matrix: SearchWindowMatrix,
  window_id: number
): SelectWindowResult {
  const [find, row, col] = findSearchWindowById(matrix, window_id)
  if (find) {
    if (isCurrentRow(matrix, row)) {
      return [ false ]
    } else {
      const new_matrix = changeCurrentRowInColumn(matrix, row, col)
      return [ true, { new_matrix, row, col } ]
    }
  } else {
    return [ false ]
  }
}
