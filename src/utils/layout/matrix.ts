import { SearchWindow } from './window'

export function isCurrentRow(
  matrix: Array<Array<SearchWindow>>,
  row: number
) {
  return row === (matrix.length - 1)
}
